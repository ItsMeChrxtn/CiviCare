const mongoose = require('mongoose');

const hotlineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "MDRRMO", "Barangay Health Center"
    category: {
      type: String,
      enum: ['police', 'fire', 'medical', 'mdrrmo', 'barangay', 'hospital', 'utility', 'other'],
      default: 'other',
    },
    number: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    address: { type: String, trim: true },
    availability: { type: String, trim: true, default: '24/7' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hotline', hotlineSchema);
