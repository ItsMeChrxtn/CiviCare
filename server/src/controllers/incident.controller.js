const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { nextReferenceCode } = require('../utils/referenceCode');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyUser, notifyRole } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { deliverSms } = require('../services/sms.service');
const { writeLog } = require('../services/log.service');
const { emitToRole } = require('../config/socket');
const { INCIDENT_STATUS, NOTIFICATION_TYPE, ROLES } = require('../config/constants');

const CATEGORY_LABELS = {
  fire: 'Fire Hazard',
  electrical: 'Electrical Hazard',
  road_accident: 'Road Accident',
  rescue: 'Rescue',
  flood: 'Flooding',
  earthquake: 'Earthquake',
  typhoon: 'Typhoon',
  medical: 'Medical Emergency',
  crime: 'Criminal Incident',
  dispute: 'Interpersonal Dispute',
  accident: 'Accident',
  infrastructure: 'Infrastructure Damage',
  other: 'Other Incident',
};

const STATUS_LABELS = { pending: 'Pending', assigned: 'Ongoing', ongoing: 'Ongoing', resolved: 'Resolved' };

/** Pushes the lightweight map payload so officials' Leaflet maps update without a refetch. */
const emitIncidentChange = (event, incident) => {
  const payload = {
    _id: incident._id,
    referenceCode: incident.referenceCode,
    title: incident.title,
    category: incident.category,
    severity: incident.severity,
    status: incident.status,
    location: incident.location,
    createdAt: incident.createdAt,
  };
  emitToRole(ROLES.OFFICIAL, event, payload);
  emitToRole(ROLES.ADMIN, event, payload);
};

// @route POST /api/incidents (resident)
const createIncident = catchAsync(async (req, res) => {
  const { category, severity, lat, lng, address } = req.body;
  const title = req.body.title?.trim() || CATEGORY_LABELS[category] || 'Incident report';
  const description = req.body.description?.trim() || '';

  const images = req.files?.length
    ? await Promise.all(req.files.map((file) => uploadBuffer(file.buffer, 'incidents')))
    : [];

  const referenceCode = await nextReferenceCode(Incident, 'INC');

  const incident = await Incident.create({
    referenceCode,
    reportedBy: req.user._id,
    title,
    description,
    category,
    severity,
    location: { type: 'Point', coordinates: [Number(lng), Number(lat)], address },
    images,
    statusHistory: [{ status: INCIDENT_STATUS.PENDING, updatedBy: req.user._id }],
  });

  const officials = await User.find({ role: { $in: [ROLES.OFFICIAL, ROLES.ADMIN] }, isArchived: false, isActive: true }).select(
    '_id phone role'
  );
  await notifyRole({
    recipients: officials.filter((o) => o.role === ROLES.OFFICIAL).map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.INCIDENT,
    title: 'New incident reported',
    message: `${req.user.fullName} reported: ${title} (${severity})`,
    link: `/official/incidents/${incident._id}`,
    relatedId: incident._id,
  });
  emitIncidentChange('incident:new', incident);

  // SMS: confirmation to the reporter + alert to responders (fire-and-forget).
  deliverSms({
    numbers: req.user.phone,
    purpose: 'incident_confirmation',
    sentBy: req.user._id,
    message: `[CiviCare] Report received. Ticket ${referenceCode} (${title}) is now PENDING. We will text you on every update.`,
  });
  deliverSms({
    numbers: officials.map((o) => o.phone),
    purpose: 'incident_alert',
    sentBy: req.user._id,
    message: `[CiviCare ALERT] New ${severity.toUpperCase()} priority report ${referenceCode}: ${title}${
      address ? ` at ${address}` : ''
    }. Check the officials dashboard.`,
  });

  await writeLog({ req, action: 'INCIDENT_CREATE', module: 'incidents', description: `Reported ${referenceCode}: ${title}` });

  res.status(201).json(new ApiResponse(201, incident, 'Incident reported successfully'));
});

// @route GET /api/incidents
const getAllIncidents = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.reportedBy = req.user._id;

  const features = new ApiFeatures(
    Incident.find(baseFilter)
      .select(isResident ? '-internalNotes' : '-__v')
      .populate('reportedBy', 'firstName lastName email avatar residentId')
      .populate('assignedTo', 'firstName lastName'),
    req.query
  )
    .search(['title', 'description', 'referenceCode', 'location.address'])
    .filter()
    .sort()
    .paginate();

  const [incidents, total] = await Promise.all([
    features.query,
    Incident.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, incidents, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/incidents/map
// Residents see active incidents only; officials also get incidents resolved in the
// last 7 days so the green "Resolved" pins on the officials' map have something to show.
const getIncidentsForMap = catchAsync(async (req, res) => {
  const isStaff = [ROLES.OFFICIAL, ROLES.ADMIN].includes(req.user.role);
  const recent = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const filter = isStaff
    ? { isArchived: false, $or: [{ status: { $ne: INCIDENT_STATUS.RESOLVED } }, { resolvedAt: { $gte: recent } }] }
    : { isArchived: false, status: { $ne: INCIDENT_STATUS.RESOLVED } };

  const incidents = await Incident.find(filter).select('title category severity status location referenceCode createdAt');
  res.status(200).json(new ApiResponse(200, incidents));
});

// @route GET /api/incidents/:id
const getIncident = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  let query = Incident.findById(req.params.id)
    .populate('reportedBy', 'firstName lastName email phone avatar residentId')
    .populate('assignedTo', 'firstName lastName position phone')
    .populate('statusHistory.updatedBy', 'firstName lastName');
  query = isResident ? query.select('-internalNotes') : query.populate('internalNotes.author', 'firstName lastName');
  const incident = await query;

  if (!incident) throw ApiError.notFound('Incident not found');

  if (isResident && String(incident.reportedBy._id) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only view your own reports.');
  }

  res.status(200).json(new ApiResponse(200, incident));
});

const notifyReporterOfStatus = async (incident, note) => {
  const reporter = await User.findById(incident.reportedBy).select('phone');
  const label = STATUS_LABELS[incident.status] || incident.status;

  await notifyUser({
    recipient: incident.reportedBy,
    type: NOTIFICATION_TYPE.INCIDENT,
    title: 'Incident status updated',
    message: `${incident.title} (${incident.referenceCode}) is now ${label}.`,
    link: `/resident/incidents/${incident._id}`,
    relatedId: incident._id,
  });

  deliverSms({
    numbers: reporter?.phone,
    purpose: 'incident_status',
    message: `[CiviCare] Ticket ${incident.referenceCode} (${incident.title}) is now ${label.toUpperCase()}.${
      note ? ` Note: ${note.slice(0, 80)}` : ''
    }`,
  });
};

// @route PATCH /api/incidents/:id/assign (official)
// Assigning a responder means the response has started, so a Pending ticket moves to Ongoing.
const assignIncident = catchAsync(async (req, res) => {
  const { assignedTo } = req.body;
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Incident not found');

  const responder = await User.findById(assignedTo).select('firstName lastName phone');
  if (!responder) throw ApiError.badRequest('Responder not found');

  incident.assignedTo = assignedTo;
  incident.assignedAt = new Date();
  const wasPending = incident.status === INCIDENT_STATUS.PENDING;
  if (wasPending) incident.status = INCIDENT_STATUS.ONGOING;
  incident.statusHistory.push({
    status: incident.status,
    updatedBy: req.user._id,
    note: `Responder assigned: ${responder.firstName} ${responder.lastName}`,
  });
  await incident.save();

  if (wasPending) await notifyReporterOfStatus(incident, 'A responder has been assigned.');
  deliverSms({
    numbers: responder.phone,
    purpose: 'incident_alert',
    sentBy: req.user._id,
    message: `[CiviCare] You were assigned to ${incident.referenceCode}: ${incident.title}${
      incident.location?.address ? ` at ${incident.location.address}` : ''
    }.`,
  });
  emitIncidentChange('incident:updated', incident);
  await writeLog({
    req,
    action: 'INCIDENT_ASSIGN',
    module: 'incidents',
    description: `Assigned ${incident.referenceCode} to ${responder.firstName} ${responder.lastName}`,
  });

  res.status(200).json(new ApiResponse(200, incident, 'Responder assigned successfully'));
});

// @route PATCH /api/incidents/:id/status (official)
const updateIncidentStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  const allowed = [INCIDENT_STATUS.PENDING, INCIDENT_STATUS.ONGOING, INCIDENT_STATUS.RESOLVED];
  if (!allowed.includes(status)) throw ApiError.badRequest('Status must be pending, ongoing, or resolved');

  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Incident not found');

  incident.status = status;
  incident.statusHistory.push({ status, note, updatedBy: req.user._id });
  if (status === INCIDENT_STATUS.RESOLVED) {
    incident.resolvedAt = new Date();
    incident.resolutionNote = note;
  }
  await incident.save();

  await notifyReporterOfStatus(incident, note);
  emitIncidentChange('incident:updated', incident);
  await writeLog({
    req,
    action: 'INCIDENT_STATUS_UPDATE',
    module: 'incidents',
    description: `${incident.referenceCode} marked ${status}`,
  });

  res.status(200).json(new ApiResponse(200, incident, 'Status updated successfully'));
});

// @route POST /api/incidents/:id/notes (official - internal, never shown to residents)
const addInternalNote = catchAsync(async (req, res) => {
  const note = req.body.note?.trim();
  if (!note) throw ApiError.badRequest('Note is required');

  const incident = await Incident.findByIdAndUpdate(
    req.params.id,
    { $push: { internalNotes: { note, author: req.user._id } } },
    { new: true }
  ).populate('internalNotes.author', 'firstName lastName');
  if (!incident) throw ApiError.notFound('Incident not found');

  await writeLog({ req, action: 'INCIDENT_NOTE', module: 'incidents', description: `Note added to ${incident.referenceCode}` });

  res.status(201).json(new ApiResponse(201, incident.internalNotes, 'Note added'));
});

// @route PATCH /api/incidents/:id/archive
const archiveIncident = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Incident,
    moduleName: 'incident',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Incident archived'));
});

// @route PATCH /api/incidents/:id/restore
const restoreIncident = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Incident,
    moduleName: 'incident',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Incident restored'));
});

// @route GET /api/incidents/stats/overview
const getIncidentStats = catchAsync(async (_req, res) => {
  const [byStatus, byCategory, bySeverity, total] = await Promise.all([
    Incident.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$category', count: { $sum: 1 } } }]),
    Incident.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Incident.countDocuments({ isArchived: false }),
  ]);
  res.status(200).json(new ApiResponse(200, { total, byStatus, byCategory, bySeverity }));
});

module.exports = {
  createIncident,
  getAllIncidents,
  getIncidentsForMap,
  getIncident,
  assignIncident,
  updateIncidentStatus,
  addInternalNote,
  archiveIncident,
  restoreIncident,
  getIncidentStats,
};
