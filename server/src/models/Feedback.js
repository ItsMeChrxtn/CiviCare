const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: {
      type: String,
      enum: ['service', 'official', 'facility', 'system', 'suggestion', 'complaint'],
      default: 'suggestion',
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5 },

    relatedTo: { type: String, trim: true }, // e.g. document/incident reference code

    status: { type: String, enum: ['new', 'reviewed', 'resolved'], default: 'new' },
    response: { type: String, trim: true },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: { type: Date },

    isAnonymous: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
