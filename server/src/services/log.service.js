const Log = require('../models/Log');

/** Fire-and-forget audit log writer; failures never block the calling request. */
const writeLog = async ({ req, action, module, description, level = 'info', meta }) => {
  try {
    await Log.create({
      actor: req.user?._id,
      actorRole: req.user?.role,
      action,
      module,
      description,
      level,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      meta,
    });
  } catch (err) {
    console.error('[Log] Failed to write audit log:', err.message);
  }
};

module.exports = { writeLog };
