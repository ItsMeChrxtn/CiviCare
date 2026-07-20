const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const addressSchema = new mongoose.Schema(
  {
    purok: { type: String, trim: true },
    street: { type: String, trim: true },
    barangay: { type: String, trim: true, default: 'Barangay' },
    city: { type: String, trim: true },
    province: { type: String, trim: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true },
    lastName: { type: String, required: true, trim: true },
    suffix: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: { type: String, required: true, minlength: 8, select: false },

    phone: { type: String, trim: true },
    birthdate: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    civilStatus: {
      type: String,
      enum: ['single', 'married', 'widowed', 'separated', 'divorced'],
      default: 'single',
    },
    occupation: { type: String, trim: true },
    address: addressSchema,

    avatar: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    validIdImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.RESIDENT,
    },
    position: { type: String, trim: true }, // e.g. "Barangay Captain", "SK Chairman" (officials only)

    qrCode: { type: String, unique: true, sparse: true }, // unique id used for event attendance / verification

    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },

    passwordChangedAt: { type: Date },
    lastLoginAt: { type: Date },

    fcmTokens: [{ type: String }], // reserved for future push notification support
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
userSchema.index({ isArchived: 1 });
userSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtTimestamp) {
  if (!this.passwordChangedAt) return false;
  const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtTimestamp < changedTimestamp;
};

userSchema.virtual('fullName').get(function fullName() {
  return [this.firstName, this.middleName, this.lastName, this.suffix].filter(Boolean).join(' ');
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
