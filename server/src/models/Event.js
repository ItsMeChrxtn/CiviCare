const mongoose = require('mongoose');
const { EVENT_STATUS } = require('../config/constants');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['health', 'sports', 'education', 'livelihood', 'disaster_drill', 'community', 'other'],
      default: 'community',
    },
    coverImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    gallery: [
      {
        url: String,
        publicId: String,
      },
    ],

    location: { type: String, required: true, trim: true },
    coordinates: { type: [Number] }, // [lng, lat] optional pin on hazard/community map

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    capacity: { type: Number, default: 0 }, // 0 = unlimited
    status: { type: String, enum: Object.values(EVENT_STATUS), default: EVENT_STATUS.UPCOMING },

    organizedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Event', eventSchema);
