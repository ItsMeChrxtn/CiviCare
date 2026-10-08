const mongoose = require('mongoose');

/** One row per outbound SMS request (a batch counts its recipients). Feeds the Emergency SMS usage view. */
const smsLogSchema = new mongoose.Schema(
  {
    purpose: {
      type: String,
      enum: ['broadcast', 'announcement', 'incident_confirmation', 'incident_alert', 'incident_status', 'document', 'other'],
      default: 'other',
    },
    message: { type: String, required: true },
    recipientCount: { type: Number, default: 0 },
    recipients: [{ type: String }], // first few numbers only, for display
    status: { type: String, enum: ['sent', 'skipped', 'failed'], required: true },
    error: { type: String },
    sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

smsLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SmsLog', smsLogSchema);
