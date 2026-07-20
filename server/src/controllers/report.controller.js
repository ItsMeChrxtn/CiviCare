const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const { generateExcelBuffer } = require('../services/excel.service');
const { ROLES } = require('../config/constants');

// @route GET /api/reports/overview (official/admin dashboard cards)
const getOverview = catchAsync(async (_req, res) => {
  const [residents, pendingIncidents, ongoingIncidents, pendingDocuments, upcomingEvents, totalDonations, newFeedback] =
    await Promise.all([
      User.countDocuments({ role: ROLES.RESIDENT, isArchived: false }),
      Incident.countDocuments({ status: 'pending', isArchived: false }),
      Incident.countDocuments({ status: { $in: ['assigned', 'ongoing'] }, isArchived: false }),
      Document.countDocuments({ status: 'pending', isArchived: false }),
      Event.countDocuments({ status: 'upcoming', isArchived: false }),
      Donation.countDocuments({ isArchived: false }),
      Feedback.countDocuments({ status: 'new', isArchived: false }),
    ]);

  res.status(200).json(
    new ApiResponse(200, {
      residents,
      pendingIncidents,
      ongoingIncidents,
      pendingDocuments,
      upcomingEvents,
      totalDonations,
      newFeedback,
    })
  );
});

/** Builds a { _id: 'YYYY-MM', count } series for the last `months` months. */
const monthlySeries = async (Model, extraMatch = {}) => {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  return Model.aggregate([
    { $match: { createdAt: { $gte: since }, isArchived: false, ...extraMatch } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);
};

// @route GET /api/reports/trends (12-month charts for incidents/documents/donations)
const getTrends = catchAsync(async (_req, res) => {
  const [incidents, documents, donations, events] = await Promise.all([
    monthlySeries(Incident),
    monthlySeries(Document),
    monthlySeries(Donation),
    monthlySeries(Event),
  ]);
  res.status(200).json(new ApiResponse(200, { incidents, documents, donations, events }));
});

const REPORT_MODELS = {
  incidents: { Model: Incident, columns: ['referenceCode', 'title', 'category', 'severity', 'status', 'createdAt'] },
  documents: { Model: Document, columns: ['referenceCode', 'type', 'purpose', 'status', 'fee', 'createdAt'] },
  donations: { Model: Donation, columns: ['referenceCode', 'type', 'amount', 'status', 'createdAt'] },
  announcements: { Model: Announcement, columns: ['title', 'category', 'views', 'createdAt'] },
  feedback: { Model: Feedback, columns: ['subject', 'category', 'status', 'rating', 'createdAt'] },
};

// @route GET /api/reports/export/excel?module=incidents&from=&to=
const exportExcel = catchAsync(async (req, res) => {
  const { module: moduleName, from, to } = req.query;
  const entry = REPORT_MODELS[moduleName] || REPORT_MODELS.incidents;

  const filter = { isArchived: false };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const rows = await entry.Model.find(filter).lean();
  const buffer = await generateExcelBuffer({
    sheetName: moduleName,
    columns: entry.columns.map((key) => ({ header: key, key, width: 22 })),
    rows,
  });

  res.setHeader('Content-Disposition', `attachment; filename=${moduleName}-report.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.status(200).send(buffer);
});

module.exports = { getOverview, getTrends, exportExcel };
