const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Announcement = require('../models/Announcement');
const User = require('../models/User');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyRole } = require('../services/notification.service');
const { deliverSms } = require('../services/sms.service');
const { writeLog } = require('../services/log.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { emitToRole } = require('../config/socket');
const { NOTIFICATION_TYPE, ROLES } = require('../config/constants');

// @route POST /api/announcements
const createAnnouncement = catchAsync(async (req, res) => {
  const { title, content, category, isPinned, sendSms: shouldSendSms } = req.body;

  const coverImage = req.file ? await uploadBuffer(req.file.buffer, 'announcements') : undefined;

  const announcement = await Announcement.create({
    title,
    content,
    category,
    isPinned: isPinned === 'true' || isPinned === true,
    coverImage,
    postedBy: req.user._id,
    sentViaSms: shouldSendSms === 'true' || shouldSendSms === true,
  });

  const residents = await User.find({ role: ROLES.RESIDENT, isArchived: false, isActive: true }).select('_id phone');

  await notifyRole({
    recipients: residents.map((r) => r._id),
    role: ROLES.RESIDENT,
    type: NOTIFICATION_TYPE.ANNOUNCEMENT,
    title: 'New announcement',
    message: title,
    link: `/announcements/${announcement._id}`,
    relatedId: announcement._id,
  });

  if (shouldSendSms === 'true' || shouldSendSms === true) {
    deliverSms({
      numbers: residents.map((r) => r.phone),
      purpose: 'announcement',
      sentBy: req.user._id,
      message: `[CiviCare] ${title}: ${content.slice(0, 100)}`,
    });
  }

  await writeLog({ req, action: 'ANNOUNCEMENT_CREATE', module: 'announcements', description: `Published "${title}"` });

  res.status(201).json(new ApiResponse(201, announcement, 'Announcement published successfully'));
});

// @route GET /api/announcements
const getAllAnnouncements = catchAsync(async (req, res) => {
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (!['official', 'admin'].includes(req.user?.role)) baseFilter.isPublished = true;

  const features = new ApiFeatures(Announcement.find(baseFilter).populate('postedBy', 'firstName lastName position'), req.query)
    .search(['title', 'content'])
    .filter()
    .sort()
    .paginate();

  const [items, total] = await Promise.all([
    features.query,
    Announcement.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/announcements/:id
const getAnnouncement = catchAsync(async (req, res) => {
  let announcement;
  let isNewView = true;

  if (req.user) {
    // Authenticated - only count and notify officials the first time this user views it.
    announcement = await Announcement.findOneAndUpdate(
      { _id: req.params.id, viewedBy: { $ne: req.user._id } },
      { $inc: { views: 1 }, $addToSet: { viewedBy: req.user._id } },
      { new: true }
    ).populate('postedBy', 'firstName lastName position');

    if (!announcement) {
      isNewView = false;
      announcement = await Announcement.findById(req.params.id).populate('postedBy', 'firstName lastName position');
    }
  } else {
    // Anonymous visitor - no reliable identity to dedupe against, count as before.
    announcement = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('postedBy', 'firstName lastName position');
  }

  if (!announcement) throw ApiError.notFound('Announcement not found');

  if (isNewView) {
    const viewPayload = { id: announcement._id, views: announcement.views };
    emitToRole(ROLES.OFFICIAL, 'announcement:viewed', viewPayload);
    emitToRole(ROLES.ADMIN, 'announcement:viewed', viewPayload);
  }

  res.status(200).json(new ApiResponse(200, announcement));
});

// @route PATCH /api/announcements/:id
const updateAnnouncement = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.coverImage = await uploadBuffer(req.file.buffer, 'announcements');

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!announcement) throw ApiError.notFound('Announcement not found');
  res.status(200).json(new ApiResponse(200, announcement, 'Announcement updated successfully'));
});

// @route PATCH /api/announcements/:id/archive
const archiveAnnouncement = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Announcement,
    moduleName: 'announcement',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Announcement archived'));
});

// @route PATCH /api/announcements/:id/restore
const restoreAnnouncement = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Announcement,
    moduleName: 'announcement',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Announcement restored'));
});

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncement,
  updateAnnouncement,
  archiveAnnouncement,
  restoreAnnouncement,
};
