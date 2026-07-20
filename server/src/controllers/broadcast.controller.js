const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const { notifyRole } = require('../services/notification.service');
const { broadcastSms } = require('../services/sms.service');
const { NOTIFICATION_TYPE, ROLES } = require('../config/constants');

/**
 * Standalone broadcast tool for officials/admins - used for emergency alerts
 * and general notices that aren't tied to a specific Announcement record.
 * Pushes an in-app real-time notification to every resident and, optionally,
 * a matching SMS blast via Semaphore.
 */

// @route POST /api/broadcast
const sendBroadcast = catchAsync(async (req, res) => {
  const { title, message, channel } = req.body; // channel: 'app' | 'sms' | 'both'
  if (!title || !message) throw ApiError.badRequest('Title and message are required.');

  const residents = await User.find({ role: ROLES.RESIDENT, isArchived: false, isActive: true }).select('_id phone');

  let notifiedCount = 0;
  let smsResult = null;

  if (channel !== 'sms') {
    await notifyRole({
      recipients: residents.map((r) => r._id),
      role: ROLES.RESIDENT,
      type: NOTIFICATION_TYPE.EMERGENCY,
      title,
      message,
    });
    notifiedCount = residents.length;
  }

  if (channel === 'sms' || channel === 'both') {
    const numbers = residents.map((r) => r.phone).filter(Boolean);
    smsResult = await broadcastSms(numbers, `[CiviCare Alert] ${title}: ${message}`);
  }

  res.status(200).json(
    new ApiResponse(200, { notifiedCount, smsResult }, 'Broadcast sent successfully')
  );
});

module.exports = { sendBroadcast };
