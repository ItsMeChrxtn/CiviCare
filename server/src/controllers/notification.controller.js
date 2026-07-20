const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Notification = require('../models/Notification');

// @route GET /api/notifications
const getMyNotifications = catchAsync(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments({ recipient: req.user._id }),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  res.status(200).json(
    new ApiResponse(200, notifications, 'Fetched successfully', {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    })
  );
});

// @route PATCH /api/notifications/:id/read
const markAsRead = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  res.status(200).json(new ApiResponse(200, notification));
});

// @route PATCH /api/notifications/read-all
const markAllAsRead = catchAsync(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.status(200).json(new ApiResponse(200, null, 'All notifications marked as read'));
});

// @route DELETE /api/notifications/:id
const deleteNotification = catchAsync(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound('Notification not found');
  res.status(200).json(new ApiResponse(200, null, 'Notification deleted'));
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
