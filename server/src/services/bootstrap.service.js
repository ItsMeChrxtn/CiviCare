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

const runStartupTasks = async () => {
  try {
    await backfillResidentIds();
    await migrateAssignedIncidents();
  } catch (err) {
    console.error('[Bootstrap] Startup task failed:', err.message);
  }
  await scheduleAutoBackups();
};

module.exports = { runStartupTasks, backfillResidentIds };
