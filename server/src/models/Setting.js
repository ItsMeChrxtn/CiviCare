const mongoose = require('mongoose');

/**
 * Flexible key/value settings store, e.g.
 *  { key: 'general', value: { barangayName, address, logoUrl, officeHours } }
 *  { key: 'sms',     value: { senderName, enabled } }
 *  { key: 'email',   value: { fromName, enabled } }
 *  { key: 'faqs',    value: [{ question, answer, order }] }
 *  { key: 'categories', value: { incidentCategories: [...], documentFees: {...} } }
 */
const settingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, default: {} },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Setting', settingSchema);
