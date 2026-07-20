const mongoose = require('mongoose');
const { DOCUMENT_TYPE, DOCUMENT_STATUS } = require('../config/constants');

const documentSchema = new mongoose.Schema(
  {
    referenceCode: { type: String, required: true, unique: true }, // e.g. DOC-2026-000321
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: Object.values(DOCUMENT_TYPE), required: true },
    purpose: { type: String, required: true, trim: true },

    // Extra fields depending on document type (business name, income bracket, etc.)
    details: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: { type: String, enum: Object.values(DOCUMENT_STATUS), default: DOCUMENT_STATUS.PENDING },

    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, trim: true },

    fee: { type: Number, default: 0 },

    qrCode: { type: String }, // encodes verification URL / reference code
    pdfFile: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    issuedAt: { type: Date },
    claimedAt: { type: Date },

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

documentSchema.index({ status: 1, type: 1 });
documentSchema.index({ requestedBy: 1 });

module.exports = mongoose.model('Document', documentSchema);
