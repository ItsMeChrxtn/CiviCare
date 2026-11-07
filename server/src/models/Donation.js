const mongoose = require('mongoose');
const { DONATION_TYPE, DONATION_STATUS, DONATION_DELIVERY, DONATION_CONDITION } = require('../config/constants');

const donationSchema = new mongoose.Schema(
  {
    referenceCode: { type: String, required: true, unique: true }, // e.g. DON-2026-000045
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    type: { type: String, enum: Object.values(DONATION_TYPE), required: true },
    description: { type: String, trim: true }, // e.g. "20 sacks of rice"
    quantity: { type: String, trim: true }, // free text, e.g. "20 sacks" or amount label
    amount: { type: Number, default: 0 }, // used when type = cash
    itemCondition: { type: String, enum: Object.values(DONATION_CONDITION) }, // not used for cash

    // Panel revision: how the resident hands the donation over. Older pledges have none of these.
    deliveryMethod: { type: String, enum: Object.values(DONATION_DELIVERY) },
    targetDate: { type: Date },
    contactNumber: { type: String, trim: true },
    pickupAddress: { type: String, trim: true },

    proofImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    status: { type: String, enum: Object.values(DONATION_STATUS), default: DONATION_STATUS.PLEDGED },
    beneficiary: { type: String, trim: true }, // e.g. "Flood victims - Purok 3"

    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    acknowledgedAt: { type: Date },
    acknowledgementNote: { type: String, trim: true },

    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

donationSchema.index({ status: 1, type: 1 });

module.exports = mongoose.model('Donation', donationSchema);
