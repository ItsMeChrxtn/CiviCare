const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Feedback = require('../models/Feedback');
const { notifyUser } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { NOTIFICATION_TYPE, ROLES } = require('../config/constants');

// @route POST /api/feedback
const createFeedback = catchAsync(async (req, res) => {
  const feedback = await Feedback.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, feedback, 'Feedback submitted successfully. Thank you!'));
});

// @route GET /api/feedback
const getAllFeedback = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.submittedBy = req.user._id;

  const features = new ApiFeatures(
    Feedback.find(baseFilter).populate('submittedBy', 'firstName lastName avatar'),
    req.query
  )
    .search(['subject', 'message'])
    .filter()
    .sort()
    .paginate();

  const [items, total] = await Promise.all([
    features.query,
    Feedback.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route PATCH /api/feedback/:id/respond (official/admin)
const respondToFeedback = catchAsync(async (req, res) => {
  const { response, status } = req.body;
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound('Feedback not found');

  feedback.response = response;
  feedback.status = status || 'resolved';
  feedback.respondedBy = req.user._id;
  feedback.respondedAt = new Date();
  await feedback.save();

  if (!feedback.isAnonymous) {
    await notifyUser({
      recipient: feedback.submittedBy,
      type: NOTIFICATION_TYPE.SYSTEM,
      title: 'Your feedback received a response',
      message: response,
      link: `/resident/feedback/${feedback._id}`,
      relatedId: feedback._id,
    });
  }

  res.status(200).json(new ApiResponse(200, feedback, 'Response sent successfully'));
});

// @route PATCH /api/feedback/:id/archive
const archiveFeedback = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Feedback,
    moduleName: 'feedback',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Feedback archived'));
});

// @route PATCH /api/feedback/:id/restore
const restoreFeedback = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Feedback,
    moduleName: 'feedback',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Feedback restored'));
});

module.exports = { createFeedback, getAllFeedback, respondToFeedback, archiveFeedback, restoreFeedback };
