const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Donation = require('../models/Donation');
const { nextReferenceCode } = require('../utils/referenceCode');
const { notifyRole, notifyUser } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { writeLog } = require('../services/log.service');
const { NOTIFICATION_TYPE, ROLES, DONATION_STATUS, DONATION_TYPE, DONATION_DELIVERY, DONATION_CONDITION } = require('../config/constants');

const DONOR_FIELDS = 'firstName lastName email phone residentId address avatar';

const manilaToday = () => new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

/** Checks the hand-over step of the pledge form and returns the fields to store. */
const parseHandover = ({ deliveryMethod, targetDate, contactNumber, pickupAddress }) => {
  if (!Object.values(DONATION_DELIVERY).includes(deliveryMethod)) throw ApiError.badRequest('Please choose how you will hand over your donation.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate || '') || Number.isNaN(Date.parse(targetDate))) throw ApiError.badRequest('Please choose a target date.');
  if (targetDate < manilaToday()) throw ApiError.badRequest('The target date cannot be in the past.');
  const day = new Date(targetDate).getUTCDay();
  if (day === 0 || day === 6) throw ApiError.badRequest('Please choose a weekday (Monday to Friday).');
  const phone = String(contactNumber || '').replace(/[\s-]/g, '');
  if (!/^(09|\+639)\d{9}$/.test(phone)) throw ApiError.badRequest('Please enter a valid mobile number.');
  const isPickup = deliveryMethod === DONATION_DELIVERY.PICKUP;
  if (isPickup && !pickupAddress?.trim()) throw ApiError.badRequest('Please add your address in My Profile before requesting a pickup.');
  return { deliveryMethod, targetDate, contactNumber: phone, pickupAddress: isPickup ? pickupAddress.trim() : undefined };
};

// @route POST /api/donations (resident pledges a donation)
const createDonation = catchAsync(async (req, res) => {
  const { type, description, quantity, amount, itemCondition } = req.body;
  if (!Object.values(DONATION_TYPE).includes(type)) throw ApiError.badRequest('Please choose a donation type.');
  if (type === DONATION_TYPE.CASH ? !(Number(amount) > 0) : !quantity?.trim()) {
    throw ApiError.badRequest(type === DONATION_TYPE.CASH ? 'Please enter the amount.' : 'Please enter the quantity / description.');
  }

  const isCash = type === DONATION_TYPE.CASH;
  if (!isCash && !Object.values(DONATION_CONDITION).includes(itemCondition)) throw ApiError.badRequest('Please choose the item condition.');
  const handover = parseHandover(req.body);

  const referenceCode = await nextReferenceCode(Donation, 'DON');

  const donation = await Donation.create({
    referenceCode,
    donor: req.user._id,
    type,
    description,
    quantity,
    amount: isCash ? Number(amount) : 0,
    itemCondition: isCash ? undefined : itemCondition,
    ...handover,
  });

  const staff = await require('../models/User').find({ role: { $in: [ROLES.OFFICIAL, ROLES.ADMIN] }, isArchived: false }).select('_id');
  await notifyRole({
    recipients: staff.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.DONATION,
    title: 'New donation pledged',
    message: `${req.user.fullName} pledged a ${type} donation (${handover.deliveryMethod === DONATION_DELIVERY.PICKUP ? 'home pickup' : 'drop-off'}).`,
    link: '/official/donations',
    relatedId: donation._id,
  });

  await writeLog({ req, action: 'DONATION_PLEDGE', module: 'donations', description: `Pledged ${referenceCode} (${type})` });

  res.status(201).json(new ApiResponse(201, donation, 'Donation pledge submitted successfully'));
});

// @route GET /api/donations
const getAllDonations = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.donor = req.user._id;

  const features = new ApiFeatures(Donation.find(baseFilter).populate('donor', DONOR_FIELDS).populate('acknowledgedBy', 'firstName lastName'), req.query)
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
  const donation = await Donation.findById(req.params.id).populate('donor', DONOR_FIELDS).populate('acknowledgedBy', 'firstName lastName');
  if (!donation) throw ApiError.notFound('Donation not found');
  if (req.user.role === ROLES.RESIDENT && String(donation.donor?._id) !== String(req.user._id)) throw ApiError.forbidden();
  res.status(200).json(new ApiResponse(200, donation));
});

// @route PATCH /api/donations/:id/status (official acknowledges / updates status)
const updateDonationStatus = catchAsync(async (req, res) => {
  const { status, acknowledgementNote } = req.body;
  if (!Object.values(DONATION_STATUS).includes(status) || status === DONATION_STATUS.CANCELLED) throw ApiError.badRequest('Invalid status');

  const donation = await Donation.findById(req.params.id);
  if (!donation) throw ApiError.notFound('Donation not found');
  if (donation.status === DONATION_STATUS.CANCELLED) throw ApiError.badRequest('This pledge was cancelled by the resident.');

  donation.status = status;
  if (status === DONATION_STATUS.RECEIVED) {
    donation.acknowledgedBy = req.user._id;
    donation.acknowledgedAt = new Date();
    donation.acknowledgementNote = acknowledgementNote;
  }
  await donation.save({ validateModifiedOnly: true });

  await notifyUser({
    recipient: donation.donor,
    type: NOTIFICATION_TYPE.DONATION,
    title: 'Donation status updated',
    message: `Your donation (${donation.referenceCode}) is now "${status}". Thank you for your generosity!`,
    link: '/resident/donations',
    relatedId: donation._id,
  });

  await writeLog({ req, action: 'DONATION_STATUS', module: 'donations', description: `${donation.referenceCode} marked ${status}` });

  res.status(200).json(new ApiResponse(200, donation, 'Donation status updated'));
});

// @route PATCH /api/donations/:id/cancel (resident cancels their own pledge before it is received)
const cancelDonation = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw ApiError.notFound('Donation not found');
  if (String(donation.donor) !== String(req.user._id)) throw ApiError.forbidden('You can only cancel your own pledges.');
  if (donation.status !== DONATION_STATUS.PLEDGED) {
    throw ApiError.badRequest('Only pledges that have not yet been received by the barangay can be cancelled.');
  }

  donation.status = DONATION_STATUS.CANCELLED;
  donation.acknowledgementNote = req.body.reason?.trim() || donation.acknowledgementNote;
  await donation.save({ validateModifiedOnly: true });

  const staff = await require('../models/User').find({ role: { $in: [ROLES.OFFICIAL, ROLES.ADMIN] }, isArchived: false }).select('_id');
  await notifyRole({
    recipients: staff.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.DONATION,
    title: 'Donation pledge cancelled',
    message: `${req.user.fullName} cancelled pledge ${donation.referenceCode}.`,
    link: '/official/donations',
    relatedId: donation._id,
  });

  await writeLog({ req, action: 'DONATION_CANCEL', module: 'donations', description: `Cancelled pledge ${donation.referenceCode}` });

  res.status(200).json(new ApiResponse(200, donation, 'Donation pledge cancelled'));
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
  cancelDonation,
  getDonationStats,
  archiveDonation,
  restoreDonation,
};
