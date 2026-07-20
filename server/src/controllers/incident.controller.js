const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Incident = require('../models/Incident');
const { nextReferenceCode } = require('../utils/referenceCode');
const { uploadBuffer } = require('../services/cloudinary.service');
const { notifyUser, notifyRole } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { INCIDENT_STATUS, NOTIFICATION_TYPE, ROLES } = require('../config/constants');

// @route POST /api/incidents (resident)
const createIncident = catchAsync(async (req, res) => {
  const { title, description, category, severity, lat, lng, address } = req.body;

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

  const officials = await require('../models/User').find({ role: ROLES.OFFICIAL, isArchived: false }).select('_id');
  await notifyRole({
    recipients: officials.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.INCIDENT,
    title: 'New incident reported',
    message: `${req.user.fullName} reported: ${title} (${severity})`,
    link: `/official/incidents/${incident._id}`,
    relatedId: incident._id,
  });

  res.status(201).json(new ApiResponse(201, incident, 'Incident reported successfully'));
});

// @route GET /api/incidents
const getAllIncidents = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.reportedBy = req.user._id;

  const features = new ApiFeatures(
    Incident.find(baseFilter).populate('reportedBy', 'firstName lastName email avatar').populate('assignedTo', 'firstName lastName'),
    req.query
  )
    .search(['title', 'description', 'referenceCode'])
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

// @route GET /api/incidents/map (all active, for the hazard/incident map layer)
const getIncidentsForMap = catchAsync(async (_req, res) => {
  const incidents = await Incident.find({ isArchived: false, status: { $ne: INCIDENT_STATUS.RESOLVED } }).select(
    'title category severity status location referenceCode createdAt'
  );
  res.status(200).json(new ApiResponse(200, incidents));
});

// @route GET /api/incidents/:id
const getIncident = catchAsync(async (req, res) => {
  const incident = await Incident.findById(req.params.id)
    .populate('reportedBy', 'firstName lastName email phone avatar')
    .populate('assignedTo', 'firstName lastName')
    .populate('statusHistory.updatedBy', 'firstName lastName');

  if (!incident) throw ApiError.notFound('Incident not found');

  if (req.user.role === ROLES.RESIDENT && String(incident.reportedBy._id) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only view your own reports.');
  }

  res.status(200).json(new ApiResponse(200, incident));
});

// @route PATCH /api/incidents/:id/assign (official)
const assignIncident = catchAsync(async (req, res) => {
  const { assignedTo } = req.body;
  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Incident not found');

  incident.assignedTo = assignedTo;
  incident.assignedAt = new Date();
  incident.status = INCIDENT_STATUS.ASSIGNED;
  incident.statusHistory.push({ status: INCIDENT_STATUS.ASSIGNED, updatedBy: req.user._id, note: 'Responder assigned' });
  await incident.save();

  await notifyUser({
    recipient: incident.reportedBy,
    type: NOTIFICATION_TYPE.INCIDENT,
    title: 'Your incident report was assigned',
    message: `${incident.title} has been assigned to a responder.`,
    link: `/resident/incidents/${incident._id}`,
    relatedId: incident._id,
  });

  res.status(200).json(new ApiResponse(200, incident, 'Responder assigned successfully'));
});

// @route PATCH /api/incidents/:id/status (official)
const updateIncidentStatus = catchAsync(async (req, res) => {
  const { status, note } = req.body;
  if (!Object.values(INCIDENT_STATUS).includes(status)) throw ApiError.badRequest('Invalid status');

  const incident = await Incident.findById(req.params.id);
  if (!incident) throw ApiError.notFound('Incident not found');

  incident.status = status;
  incident.statusHistory.push({ status, note, updatedBy: req.user._id });
  if (status === INCIDENT_STATUS.RESOLVED) {
    incident.resolvedAt = new Date();
    incident.resolutionNote = note;
  }
  await incident.save();

  await notifyUser({
    recipient: incident.reportedBy,
    type: NOTIFICATION_TYPE.INCIDENT,
    title: 'Incident status updated',
    message: `${incident.title} is now marked as "${status}".`,
    link: `/resident/incidents/${incident._id}`,
    relatedId: incident._id,
  });

  res.status(200).json(new ApiResponse(200, incident, 'Status updated successfully'));
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
  archiveIncident,
  restoreIncident,
  getIncidentStats,
};
