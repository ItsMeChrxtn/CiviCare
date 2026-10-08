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

const runStartupTasks = async () => {
  try {
    await backfillResidentIds();
    await migrateAssignedIncidents();
    await migrateFaqsToAssistant();
  } catch (err) {
    console.error('[Bootstrap] Startup task failed:', err.message);
  }
  await scheduleAutoBackups();
};

module.exports = { runStartupTasks, backfillResidentIds };
