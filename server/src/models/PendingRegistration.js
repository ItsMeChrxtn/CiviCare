const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

// Holds unverified signups until the OTP is confirmed. Never promoted to a real
// User until then, and self-deletes via the `expiresAt` TTL index if the user
// never verifies.
const pendingRegistrationSchema = new mongoose.Schema(
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
    },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    birthdate: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
    address: addressSchema,

    otpCode: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

pendingRegistrationSchema.pre('save', async function hashSecrets(next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
  if (this.isModified('otpCode')) this.otpCode = await bcrypt.hash(this.otpCode, 10);
  next();
});

pendingRegistrationSchema.methods.compareOtp = function compareOtp(candidate) {
  return bcrypt.compare(candidate, this.otpCode);
};

module.exports = mongoose.model('PendingRegistration', pendingRegistrationSchema);
