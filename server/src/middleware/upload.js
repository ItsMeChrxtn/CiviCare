const multer = require('multer');
const ApiError = require('../utils/ApiError');

// Files are buffered in memory, then streamed to Cloudinary by the calling
// controller/service - nothing is ever written to local disk.
const storage = multer.memoryStorage();

const imageFileFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(ApiError.badRequest('Only JPG, PNG, or WEBP images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;
