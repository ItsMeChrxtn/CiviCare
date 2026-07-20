const mongoose = require('mongoose');
const { INCIDENT_STATUS, INCIDENT_SEVERITY, INCIDENT_CATEGORY } = require('../config/constants');

const incidentSchema = new mongoose.Schema(
  {
    referenceCode: { type: String, required: true, unique: true }, // e.g. INC-2026-000123
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, enum: Object.values(INCIDENT_CATEGORY), required: true },
    severity: { type: String, enum: Object.values(INCIDENT_SEVERITY), required: true },
    status: { type: String, enum: Object.values(INCIDENT_STATUS), default: INCIDENT_STATUS.PENDING },

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, trim: true },
    },

    images: [
      {
        url: String,
        publicId: String,
      },
    ],

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // barangay official/responder
    assignedAt: { type: Date },

    statusHistory: [
      {
        status: { type: String, enum: Object.values(INCIDENT_STATUS) },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
      },
    ],

    resolutionNote: { type: String, trim: true },
    resolvedAt: { type: Date },

    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

incidentSchema.index({ location: '2dsphere' });
incidentSchema.index({ status: 1, category: 1, severity: 1 });
incidentSchema.index({ isArchived: 1 });

module.exports = mongoose.model('Incident', incidentSchema);
