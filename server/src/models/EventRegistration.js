const mongoose = require('mongoose');

const eventRegistrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    resident: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    registeredAt: { type: Date, default: Date.now },

    attendance: {
      isPresent: { type: Boolean, default: false },
      checkedInAt: { type: Date },
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // official who scanned QR
    },

    certificateIssued: { type: Boolean, default: false },
    certificateUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

eventRegistrationSchema.index({ event: 1, resident: 1 }, { unique: true });

module.exports = mongoose.model('EventRegistration', eventRegistrationSchema);
