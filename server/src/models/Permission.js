const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true }, // e.g. "manage_incidents"
    label: { type: String, required: true, trim: true }, // e.g. "Manage Incidents"
    group: { type: String, trim: true, default: 'general' }, // for UI grouping
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permission', permissionSchema);
