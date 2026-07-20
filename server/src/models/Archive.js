const mongoose = require('mongoose');

/**
 * Records every archive/restore action performed on soft-deletable
 * documents (users, incidents, announcements, events, donations, documents...).
 * The original record stays in its own collection with isArchived=true;
 * this collection is the audit trail + snapshot used to power the
 * Admin/Official "Archive System" screens and restore action.
 */
const archiveSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, trim: true }, // e.g. "incident", "announcement"
    documentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true }, // copy of the doc at archive time
    reason: { type: String, trim: true },
    action: { type: String, enum: ['archived', 'restored'], default: 'archived' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

archiveSchema.index({ module: 1, documentId: 1, createdAt: -1 });

module.exports = mongoose.model('Archive', archiveSchema);
