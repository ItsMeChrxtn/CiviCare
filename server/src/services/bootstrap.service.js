const User = require('../models/User');
const Counter = require('../models/Counter');
const Incident = require('../models/Incident');
const { scheduleAutoBackups } = require('./backup.service');

/** Gives accounts created before Resident IDs existed an ID, oldest first. */
const backfillResidentIds = async () => {
  const users = await User.find({ residentId: { $exists: false } }).sort('createdAt').select('_id createdAt');
  for (const user of users) {
    const year = new Date(user.createdAt || Date.now()).getFullYear();
    // eslint-disable-next-line no-await-in-loop
    const seq = await Counter.next(`residentId-${year}`);
    // eslint-disable-next-line no-await-in-loop
    await User.updateOne({ _id: user._id }, { residentId: `MG-${year}-${String(seq).padStart(4, '0')}` });
  }
  if (users.length) console.log(`[Bootstrap] Assigned Resident IDs to ${users.length} existing account(s).`);
};

/** The ticket tracker uses Pending -> Ongoing -> Resolved; the older "assigned" state folds into Ongoing. */
const migrateAssignedIncidents = async () => {
  const { modifiedCount } = await Incident.updateMany({ status: 'assigned' }, { status: 'ongoing' });
  if (modifiedCount) console.log(`[Bootstrap] Moved ${modifiedCount} "assigned" incident(s) to "ongoing".`);
};

/**
 * The separate FAQ list (settings key "faqs") was merged into the Assistant's Q&A tree.
 * Move any entries there into top-level Q&A nodes once, then clear the old list.
 */
const migrateFaqsToAssistant = async () => {
  const Setting = require('../models/Setting');
  const Chatbot = require('../models/Chatbot');
  const faqs = await Setting.findOne({ key: 'faqs' });
  const items = Array.isArray(faqs?.value) ? faqs.value.filter((f) => f?.question && f?.answer) : [];
  if (!items.length) return;

  const lastOrder = (await Chatbot.findOne({ parent: null }).sort('-order').select('order'))?.order ?? -1;
  let added = 0;
  for (const [i, f] of items.entries()) {
    // eslint-disable-next-line no-await-in-loop
    const exists = await Chatbot.exists({ parent: null, label: f.question });
    if (!exists) {
      // eslint-disable-next-line no-await-in-loop
      await Chatbot.create({ label: f.question, response: f.answer, parent: null, order: lastOrder + 1 + i });
      added += 1;
    }
  }
  await Setting.updateOne({ key: 'faqs' }, { value: [] });
  console.log(`[Bootstrap] Moved ${added} FAQ entr${added === 1 ? 'y' : 'ies'} into the Assistant Q&A.`);
};

/**
 * Runs a named data migration once. Applied names are kept in the "migrations" setting so
 * later admin edits (FAQ answers, evacuation pins, map center) are never overwritten again.
 */
const runOnce = async (name, task) => {
  const Setting = require('../models/Setting');
  const applied = (await Setting.findOne({ key: 'migrations' }))?.value || [];
  if (applied.includes(name)) return;
  await task();
  await Setting.findOneAndUpdate({ key: 'migrations' }, { $set: { value: [...applied, name] } }, { upsert: true });
};

// Second panel revision: maps centered on Barangay Magdiwang (philatlas.com) with the evacuation
// center pinned at Medina's Compound, Magdiwang Highway, Noveleta, Cavite.
const MAGDIWANG_CENTER = { lat: 14.4318, lng: 120.8852 };
const EVAC_CENTER_NAME = "Medina's Compound Evacuation Center";

const recenterMapAndPinEvacuationCenter = async () => {
  const Setting = require('../models/Setting');
  const Hazard = require('../models/Hazard');
  const general = await Setting.findOne({ key: 'general' });
  if (general) {
    general.value = { ...(general.value || {}), mapCenter: [MAGDIWANG_CENTER.lat, MAGDIWANG_CENTER.lng] };
    general.markModified('value');
    await general.save();
  }

  if (await Hazard.exists({ name: EVAC_CENTER_NAME })) return;
  const admin = await User.findOne({ role: { $in: ['admin', 'official'] } }).sort('createdAt').select('_id');
  if (!admin) return;
  const fields = {
    layer: 'evacuation_center',
    name: EVAC_CENTER_NAME,
    description: "Evacuation center at Medina's Compound, Magdiwang Highway, Noveleta, Cavite.",
    geometry: { type: 'Point', coordinates: [MAGDIWANG_CENTER.lng, MAGDIWANG_CENTER.lat] },
    isActive: true,
    isArchived: false,
  };
  // Re-use the sample "Covered Court" center from the seeder when present, otherwise add a new pin.
  const sample = await Hazard.findOne({ layer: 'evacuation_center', name: /Covered Court/i });
  if (sample) await Hazard.updateOne({ _id: sample._id }, fields);
  else await Hazard.create({ ...fields, createdBy: admin._id });
  await Hazard.updateMany({ layer: 'evacuation_route', name: /Covered Court/i }, { isActive: false });
  console.log("[Bootstrap] Map centered on Barangay Magdiwang; evacuation center pinned at Medina's Compound.");
};

/** Adds the Tagalog text and the panel's Assistant topics; retires topics for documents no longer offered. */
const updateAssistantTopics = async () => {
  const Chatbot = require('../models/Chatbot');
  const { CHATBOT_TREE, OBSOLETE_LABELS } = require('../seeders/chatbotTree');
  await Chatbot.updateMany({ label: { $in: OBSOLETE_LABELS } }, { isActive: false });

  const upsert = async (nodes, parent) => {
    for (const [i, { children, ...node }] of nodes.entries()) {
      // eslint-disable-next-line no-await-in-loop
      let doc = await Chatbot.findOne({ parent, label: node.label });
      // eslint-disable-next-line no-await-in-loop
      if (doc) doc = await Chatbot.findByIdAndUpdate(doc._id, { ...node, isActive: true }, { new: true });
      // eslint-disable-next-line no-await-in-loop
      else doc = await Chatbot.create({ ...node, parent, order: i });
      // eslint-disable-next-line no-await-in-loop
      if (children?.length) await upsert(children, doc._id);
    }
  };
  await upsert(CHATBOT_TREE, null);

  // Put the topics in the panel's order; any admin-added topics follow after them.
  const labels = CHATBOT_TREE.map((n) => n.label);
  const roots = await Chatbot.find({ parent: null }).sort('order');
  const ordered = [...labels.map((l) => roots.find((r) => r.label === l)).filter(Boolean), ...roots.filter((r) => !labels.includes(r.label))];
  await Promise.all(ordered.map((r, i) => Chatbot.updateOne({ _id: r._id }, { order: i })));
  console.log('[Bootstrap] Assistant / FAQ topics updated with Tagalog translations.');
};

const runStartupTasks = async () => {
  try {
    await backfillResidentIds();
    await migrateAssignedIncidents();
    await migrateFaqsToAssistant();
    await runOnce('2026-10-panel-map', recenterMapAndPinEvacuationCenter);
    await runOnce('2026-10-panel-assistant', updateAssistantTopics);
  } catch (err) {
    console.error('[Bootstrap] Startup task failed:', err.message);
  }
  await scheduleAutoBackups();
};

module.exports = { runStartupTasks, backfillResidentIds };
