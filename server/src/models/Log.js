const mongoose = require('mongoose');

/** Audit / system log entry - who did what, where, and when. */
const logSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    action: { type: String, required: true, trim: true }, // e.g. "LOGIN", "INCIDENT_STATUS_UPDATE"
    module: { type: String, required: true, trim: true }, // e.g. "auth", "incidents"
    description: { type: String, trim: true },
    level: { type: String, enum: ['info', 'warning', 'error'], default: 'info' },
    ipAddress: { type: String },
    userAgent: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

logSchema.index({ module: 1, createdAt: -1 });
logSchema.index({ actor: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
