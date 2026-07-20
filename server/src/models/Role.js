const mongoose = require('mongoose');

/**
 * Custom roles beyond the built-in resident/official/admin, allowing the
 * administrator to define additional roles (e.g. "SK Chairman", "Tanod")
 * with a specific set of permissions attached.
 */
const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
    isSystemRole: { type: Boolean, default: false }, // resident/official/admin - not deletable
  },
  { timestamps: true }
);

module.exports = mongoose.model('Role', roleSchema);
