const mongoose = require('mongoose');
const { HAZARD_LAYER } = require('../config/constants');

/**
 * A single hazard-map feature. `geometry` follows GeoJSON so React Leaflet
 * can render points (evacuation centers), lines (road closures), or
 * polygons (flood/danger zones) from the same collection.
 */
const hazardSchema = new mongoose.Schema(
  {
    layer: { type: String, enum: Object.values(HAZARD_LAYER), required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    geometry: {
      type: {
        type: String,
        enum: ['Point', 'LineString', 'Polygon'],
        required: true,
      },
      coordinates: { type: mongoose.Schema.Types.Mixed, required: true },
    },

    // Point-specific metadata (evacuation centers)
    capacity: { type: Number },
    contactPerson: { type: String, trim: true },
    contactNumber: { type: String, trim: true },

    severityLevel: { type: String, enum: ['low', 'moderate', 'high', 'critical'], default: 'moderate' },
    isActive: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

hazardSchema.index({ layer: 1, isActive: 1 });

module.exports = mongoose.model('Hazard', hazardSchema);
