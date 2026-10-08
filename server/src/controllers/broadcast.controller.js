const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const SmsLog = require('../models/SmsLog');
const { notifyRole } = require('../services/notification.service');
const { deliverSms, getAccountInfo, isConfigured } = require('../services/sms.service');
const { writeLog } = require('../services/log.service');
const { NOTIFICATION_TYPE, ROLES } = require('../config/constants');

/**
 * Standalone broadcast tool for officials/admins - used for emergency alerts
 * and general notices that aren't tied to a specific Announcement record.
 * Pushes an in-app real-time notification to every resident and, optionally,
 * a matching SMS blast via Semaphore.
 */

// @route POST /api/broadcast
const sendBroadcast = catchAsync(async (req, res) => {
  const { title, message, channel, purok } = req.body; // channel: 'app' | 'sms' | 'both'
  if (!title || !message) throw ApiError.badRequest('Title and message are required.');

  const filter = { role: ROLES.RESIDENT, isArchived: false, isActive: true };
  if (purok) filter['address.purok'] = purok;
  const residents = await User.find(filter).select('_id phone');

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

  const smsNumbers = residents.map((r) => r.phone).filter(Boolean);
  if (channel === 'sms' || channel === 'both') {
    smsResult = await deliverSms({
      numbers: smsNumbers,
      purpose: 'broadcast',
      sentBy: req.user._id,
      message: `[CiviCare Alert] ${title}: ${message}`,
    });
  }

  await writeLog({
    req,
    action: 'BROADCAST_SEND',
    module: 'broadcast',
    description: `"${title}" via ${channel}${purok ? ` to ${purok}` : ''}`,
  });

  res.status(200).json(
    new ApiResponse(200, { notifiedCount, smsCount: smsNumbers.length, smsResult }, 'Broadcast sent successfully')
  );
});

// @route GET /api/broadcast/sms-usage (Emergency SMS page: 30-day graph, recent messages, balance)
const getSmsUsage = catchAsync(async (_req, res) => {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [daily, recent, totals, account] = await Promise.all([
    SmsLog.aggregate([
      { $match: { createdAt: { $gte: since }, status: 'sent' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Manila' } },
          count: { $sum: '$recipientCount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    SmsLog.find().sort('-createdAt').limit(25).populate('sentBy', 'firstName lastName'),
    SmsLog.aggregate([{ $match: { createdAt: { $gte: since } } }, { $group: { _id: '$status', count: { $sum: '$recipientCount' } } }]),
    getAccountInfo(),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      configured: isConfigured(),
      account,
      daily,
      totals: Object.fromEntries(totals.map((t) => [t._id, t.count])),
      recent,
    })
  );
});

module.exports = { sendBroadcast, getSmsUsage };
