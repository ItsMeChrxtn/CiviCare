const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const User = require('../models/User');
const Incident = require('../models/Incident');
const Document = require('../models/Document');
const Donation = require('../models/Donation');
const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Feedback = require('../models/Feedback');
const EventRegistration = require('../models/EventRegistration');
const { generateExcelBuffer } = require('../services/excel.service');
const { generateCsv, generateTablePdf } = require('../services/tabular.service');
const { writeLog } = require('../services/log.service');
const { ROLES } = require('../config/constants');

const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

// @route GET /api/reports/public-stats (resident dashboard "Welcome" card - no auth)
const getPublicStats = catchAsync(async (_req, res) => {
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const [residents, eventsThisWeek] = await Promise.all([
    User.countDocuments({ role: ROLES.RESIDENT, isArchived: false }),
    Event.countDocuments({ isArchived: false, status: { $ne: 'cancelled' }, startDate: { $lt: weekEnd }, endDate: { $gte: weekStart } }),
  ]);
  res.status(200).json(new ApiResponse(200, { residents, eventsThisWeek }));
});

// @route GET /api/reports/overview (official/admin dashboard cards)
const getOverview = catchAsync(async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [
    residents,
    pendingIncidents,
    ongoingIncidents,
    pendingDocuments,
    upcomingEvents,
    totalDonations,
    newFeedback,
    serviceRequestsThisMonth,
    incidentsThisMonth,
    puroks,
  ] = await Promise.all([
    User.countDocuments({ role: ROLES.RESIDENT, isArchived: false }),
    Incident.countDocuments({ status: 'pending', isArchived: false }),
    Incident.countDocuments({ status: { $in: ['assigned', 'ongoing'] }, isArchived: false }),
    Document.countDocuments({ status: { $in: ['pending', 'processing'] }, isArchived: false }),
    Event.countDocuments({ status: 'upcoming', isArchived: false }),
    Donation.countDocuments({ isArchived: false }),
    Feedback.countDocuments({ status: 'new', isArchived: false }),
    Document.countDocuments({ createdAt: { $gte: monthStart } }),
    Incident.countDocuments({ createdAt: { $gte: monthStart } }),
    User.distinct('address.purok', { role: ROLES.RESIDENT, isArchived: false, 'address.purok': { $nin: [null, ''] } }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      residents,
      pendingIncidents,
      ongoingIncidents,
      activeIncidents: pendingIncidents + ongoingIncidents,
      pendingDocuments,
      upcomingEvents,
      totalDonations,
      newFeedback,
      serviceRequestsThisMonth,
      incidentsThisMonth,
      purokCount: puroks.length,
    })
  );
});

// @route GET /api/reports/events (Events & Activities stat cards)
const getEventStats = catchAsync(async (_req, res) => {
  const now = new Date();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const upcoming = await Event.find({ status: 'upcoming', isArchived: false }).select('_id');
  const lastMonthEvents = await Event.find({ startDate: { $gte: lastMonthStart, $lt: thisMonthStart }, isArchived: false }).select('_id');

  const [participantsRegistered, lastMonthRegs, lastMonthPresent] = await Promise.all([
    EventRegistration.countDocuments({ event: { $in: upcoming.map((e) => e._id) } }),
    EventRegistration.countDocuments({ event: { $in: lastMonthEvents.map((e) => e._id) } }),
    EventRegistration.countDocuments({ event: { $in: lastMonthEvents.map((e) => e._id) }, 'attendance.isPresent': true }),
  ]);

  res.status(200).json(
    new ApiResponse(200, {
      upcomingEvents: upcoming.length,
      participantsRegistered,
      // Share of last month's registrants who actually checked in, as a percentage.
      avgEngagementRate: lastMonthRegs ? Math.round((lastMonthPresent / lastMonthRegs) * 100) : 0,
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
  incidents: { Model: Incident, title: 'Incident Reports', columns: ['referenceCode', 'title', 'category', 'severity', 'status', 'createdAt'] },
  documents: { Model: Document, title: 'Service Requests', columns: ['referenceCode', 'type', 'purpose', 'status', 'fee', 'createdAt'] },
  donations: { Model: Donation, title: 'Donations', columns: ['referenceCode', 'type', 'amount', 'status', 'createdAt'] },
  announcements: { Model: Announcement, title: 'Announcements', columns: ['title', 'category', 'views', 'createdAt'] },
  feedback: { Model: Feedback, title: 'Feedback', columns: ['subject', 'category', 'status', 'rating', 'createdAt'] },
  residents: {
    Model: User,
    title: 'Registered Residents',
    baseFilter: { role: ROLES.RESIDENT },
    columns: ['residentId', 'firstName', 'lastName', 'email', 'phone', 'purok', 'isRbiVerified', 'isActive', 'createdAt'],
    // Flatten nested fields the table can't reach directly.
    map: (u) => ({ ...u, purok: u.address?.purok || '' }),
  },
};

const fetchReportRows = async (query) => {
  const { module: moduleName, from, to } = query;
  const key = REPORT_MODELS[moduleName] ? moduleName : 'incidents';
  const entry = REPORT_MODELS[key];

  const filter = { isArchived: false, ...(entry.baseFilter || {}) };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  const raw = await entry.Model.find(filter).sort('-createdAt').lean();
  return { key, entry, rows: entry.map ? raw.map(entry.map) : raw };
};

// @route GET /api/reports/export/:format?module=incidents&from=&to=   (format: excel | csv | pdf)
const exportReport = catchAsync(async (req, res) => {
  const format = req.params.format || 'excel';
  const { key, entry, rows } = await fetchReportRows(req.query);
  const columns = entry.columns.map((c) => ({ header: c, key: c, width: 22 }));
  const stamp = new Date().toISOString().slice(0, 10);

  await writeLog({ req, action: 'REPORT_EXPORT', module: 'reports', description: `Exported ${key} as ${format}` });

  if (format === 'csv') {
    res.setHeader('Content-Disposition', `attachment; filename=${key}-report-${stamp}.csv`);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.status(200).send(generateCsv({ columns, rows }));
  }

  if (format === 'pdf') {
    const range = req.query.from || req.query.to ? `${req.query.from || '...'} to ${req.query.to || '...'}` : 'All records';
    const buffer = await generateTablePdf({
      title: `Barangay Magdiwang - ${entry.title}`,
      subtitle: `Noveleta, Cavite | ${range} | Generated ${new Date().toLocaleString('en-PH')}`,
      columns,
      rows,
    });
    res.setHeader('Content-Disposition', `attachment; filename=${key}-report-${stamp}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    return res.status(200).send(buffer);
  }

  const buffer = await generateExcelBuffer({ sheetName: key, columns, rows });
  res.setHeader('Content-Disposition', `attachment; filename=${key}-report-${stamp}.xlsx`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.status(200).send(buffer);
});

module.exports = { getPublicStats, getOverview, getEventStats, getTrends, exportReport };
