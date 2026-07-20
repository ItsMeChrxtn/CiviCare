const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Donation = require('../models/Donation');
const { nextReferenceCode } = require('../utils/referenceCode');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyRole, notifyUser } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { NOTIFICATION_TYPE, ROLES, DONATION_STATUS } = require('../config/constants');

// @route POST /api/donations (resident pledges a donation)
const createDonation = catchAsync(async (req, res) => {
  const { type, description, quantity, amount, beneficiary } = req.body;

  const proofImage = req.file ? await uploadBuffer(req.file.buffer, 'donations') : undefined;
  const referenceCode = await nextReferenceCode(Donation, 'DON');

  const donation = await Donation.create({
    referenceCode,
    donor: req.user._id,
    type,
    description,
    quantity,
    amount: amount || 0,
    beneficiary,
    proofImage,
  });

  const officials = await require('../models/User').find({ role: ROLES.OFFICIAL, isArchived: false }).select('_id');
  await notifyRole({
    recipients: officials.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.DONATION,
    title: 'New donation pledged',
    message: `${req.user.fullName} pledged a ${type} donation.`,
    link: `/official/donations/${donation._id}`,
    relatedId: donation._id,
  });

  res.status(201).json(new ApiResponse(201, donation, 'Donation pledge submitted successfully'));
});

// @route GET /api/donations
const getAllDonations = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.donor = req.user._id;

  const features = new ApiFeatures(Donation.find(baseFilter).populate('donor', 'firstName lastName avatar'), req.query)
    .search(['referenceCode', 'description', 'beneficiary'])
    .filter()
    .sort()
    .paginate();

  const [items, total] = await Promise.all([
    features.query,
    Donation.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/donations/:id
const getDonation = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id).populate('donor', 'firstName lastName email phone');
  if (!donation) throw ApiError.notFound('Donation not found');
  res.status(200).json(new ApiResponse(200, donation));
});

// @route PATCH /api/donations/:id/status (official acknowledges / updates status)
const updateDonationStatus = catchAsync(async (req, res) => {
  const { status, acknowledgementNote } = req.body;
  if (!Object.values(DONATION_STATUS).includes(status)) throw ApiError.badRequest('Invalid status');

  const donation = await Donation.findById(req.params.id);
  if (!donation) throw ApiError.notFound('Donation not found');

  donation.status = status;
  if (status === DONATION_STATUS.RECEIVED) {
    donation.acknowledgedBy = req.user._id;
    donation.acknowledgedAt = new Date();
    donation.acknowledgementNote = acknowledgementNote;
  }
  await donation.save();

  await notifyUser({
    recipient: donation.donor,
    type: NOTIFICATION_TYPE.DONATION,
    title: 'Donation status updated',
    message: `Your donation (${donation.referenceCode}) is now "${status}". Thank you for your generosity!`,
    link: `/resident/donations/${donation._id}`,
    relatedId: donation._id,
  });

  res.status(200).json(new ApiResponse(200, donation, 'Donation status updated'));
});

// @route GET /api/donations/stats/overview
const getDonationStats = catchAsync(async (_req, res) => {
  const [byType, byStatus, totalCash] = await Promise.all([
    Donation.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Donation.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Donation.aggregate([
      { $match: { isArchived: false, type: 'cash' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);
  res.status(200).json(new ApiResponse(200, { byType, byStatus, totalCash: totalCash[0]?.total || 0 }));
});

// @route PATCH /api/donations/:id/archive
const archiveDonation = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Donation,
    moduleName: 'donation',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Donation archived'));
});

// @route PATCH /api/donations/:id/restore
const restoreDonation = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Donation,
    moduleName: 'donation',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Donation restored'));
});

module.exports = {
  createDonation,
  getAllDonations,
  getDonation,
  updateDonationStatus,
  getDonationStats,
  archiveDonation,
  restoreDonation,
};
