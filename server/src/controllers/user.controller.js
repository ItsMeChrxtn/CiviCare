const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const User = require('../models/User');
const { uploadBuffer, deleteAsset } = require('../services/cloudinary.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { writeLog } = require('../services/log.service');

const SELF_UPDATABLE_FIELDS = [
  'firstName',
  'middleName',
  'lastName',
  'suffix',
  'phone',
  'birthdate',
  'gender',
  'civilStatus',
  'occupation',
  'address',
];

const pick = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

// ---------- Self-service (any authenticated user) ----------

// @route PATCH /api/users/me
const updateMe = catchAsync(async (req, res) => {
  const updates = pick(req.body, SELF_UPDATABLE_FIELDS);
  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });
  res.status(200).json(new ApiResponse(200, user, 'Profile updated successfully'));
});

// @route PATCH /api/users/me/avatar
const uploadAvatar = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided.');

  const user = await User.findById(req.user._id);
  if (user.avatar?.publicId) await deleteAsset(user.avatar.publicId);

  const uploaded = await uploadBuffer(req.file.buffer, 'avatars');
  user.avatar = uploaded;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

// @route PATCH /api/users/me/valid-id
const uploadValidId = catchAsync(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No image file provided.');

  const user = await User.findById(req.user._id);
  if (user.validIdImage?.publicId) await deleteAsset(user.validIdImage.publicId);

  const uploaded = await uploadBuffer(req.file.buffer, 'valid-ids');
  user.validIdImage = uploaded;
  await user.save({ validateBeforeSave: false });

  res.status(200).json(new ApiResponse(200, user, 'Valid ID uploaded successfully'));
});

// @route GET /api/users/me/qrcode
const getMyQrCode = catchAsync(async (req, res) => {
  const { generateQrDataUrl } = require('../services/qrcode.service');
  const qrDataUrl = await generateQrDataUrl(req.user.qrCode);
  res.status(200).json(new ApiResponse(200, { qrDataUrl, qrCode: req.user.qrCode }));
});

// ---------- Admin / Official user management ----------

// @route GET /api/users
const getAllUsers = catchAsync(async (req, res) => {
  const baseFilter = { isArchived: req.query.archived === 'true' };
  const features = new ApiFeatures(User.find(baseFilter), req.query)
    .search(['firstName', 'lastName', 'email', 'phone'])
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const [users, total] = await Promise.all([
    features.query,
    User.countDocuments(features.query.getFilter()),
  ]);

  res.status(200).json(
    new ApiResponse(200, users, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/users/:id
const getUser = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  res.status(200).json(new ApiResponse(200, user));
});

// @route POST /api/users (admin creates official/admin accounts)
const createUser = catchAsync(async (req, res) => {
  const { generateCode } = require('../services/qrcode.service');
  const existing = await User.findOne({ email: req.body.email });
  if (existing) throw ApiError.conflict('An account with this email already exists.');

  const user = await User.create({ ...req.body, qrCode: generateCode(), isVerified: true });

  await writeLog({
    req,
    action: 'USER_CREATE',
    module: 'users',
    description: `Created ${user.role} account: ${user.email}`,
  });

  res.status(201).json(new ApiResponse(201, user, 'User created successfully'));
});

// @route PATCH /api/users/:id (admin edits role, status, etc.)
const updateUser = catchAsync(async (req, res) => {
  const forbidden = ['password', 'email', 'qrCode'];
  forbidden.forEach((field) => delete req.body[field]);

  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) throw ApiError.notFound('User not found');

  await writeLog({ req, action: 'USER_UPDATE', module: 'users', description: `Updated user: ${user.email}` });

  res.status(200).json(new ApiResponse(200, user, 'User updated successfully'));
});

// @route PATCH /api/users/:id/toggle-active
const toggleActive = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot deactivate your own account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  await writeLog({
    req,
    action: 'USER_TOGGLE_ACTIVE',
    module: 'users',
    description: `${user.email} is now ${user.isActive ? 'active' : 'deactivated'}`,
  });

  res.status(200).json(new ApiResponse(200, user, `User ${user.isActive ? 'activated' : 'deactivated'}`));
});

// @route PATCH /api/users/:id/archive
const archiveUser = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot archive your own account.');
  }

  const doc = await archiveDocument({
    Model: User,
    moduleName: 'user',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'User archived successfully'));
});

// @route PATCH /api/users/:id/restore
const restoreUser = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: User,
    moduleName: 'user',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'User restored successfully'));
});

// @route DELETE /api/users/:id (hard delete - admin only, irreversible)
const deleteUser = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');

  await writeLog({
    req,
    action: 'USER_DELETE',
    module: 'users',
    description: `Permanently deleted user: ${user.email}`,
    level: 'warning',
  });

  res.status(200).json(new ApiResponse(200, null, 'User permanently deleted'));
});

// @route GET /api/users/stats/overview (admin dashboard widget)
const getUserStats = catchAsync(async (_req, res) => {
  const [total, residents, officials, admins, verified, active] = await Promise.all([
    User.countDocuments({ isArchived: false }),
    User.countDocuments({ role: 'resident', isArchived: false }),
    User.countDocuments({ role: 'official', isArchived: false }),
    User.countDocuments({ role: 'admin', isArchived: false }),
    User.countDocuments({ isVerified: true, isArchived: false }),
    User.countDocuments({ isActive: true, isArchived: false }),
  ]);

  res.status(200).json(new ApiResponse(200, { total, residents, officials, admins, verified, active }));
});

module.exports = {
  updateMe,
  uploadAvatar,
  uploadValidId,
  getMyQrCode,
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  toggleActive,
  archiveUser,
  restoreUser,
  deleteUser,
  getUserStats,
};
