const mongoose = require('mongoose');

/**
 * A single node in the rule-based chatbot's button-navigation tree.
 * `parent` = null means it's a top-level menu button (e.g. "Barangay Clearance").
 * Selecting a node shows its `response` and, if present, its children as the next buttons.
 */
const chatbotNodeSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true }, // button text
    response: { type: String, required: true, trim: true }, // shown when this node is selected
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Chatbot', default: null },
    order: { type: Number, default: 0 },
    icon: { type: String, trim: true }, // react-icon name, optional
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

chatbotNodeSchema.index({ parent: 1, order: 1 });

module.exports = mongoose.model('Chatbot', chatbotNodeSchema);
