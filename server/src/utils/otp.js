const crypto = require('crypto');

/** Generates a random 6-digit numeric OTP (zero-padded, e.g. "042817"). */
const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

module.exports = { generateOtp };
