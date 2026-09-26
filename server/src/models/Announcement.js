const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    category: {
      type: String,
      enum: ['general', 'health', 'safety', 'infrastructure', 'event', 'emergency'],
      default: 'general',
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    sentViaSms: { type: Boolean, default: false },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    // Tracks which authenticated users have already been counted, so a single
    // user re-opening the announcement doesn't keep inflating views or re-notifying officials.
    viewedBy: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [], select: false },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

announcementSchema.index({ isPublished: 1, isPinned: -1, createdAt: -1 });
announcementSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Announcement', announcementSchema);
