const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const { uploadBuffer, uploadPdfBuffer } = require('../services/cloudinary.service');
const { generateCertificatePdf } = require('../services/pdf.service');
const { notifyRole, notifyUser } = require('../services/notification.service');
const { archiveDocument, restoreDocument } = require('../services/archive.service');
const { NOTIFICATION_TYPE, ROLES, EVENT_STATUS } = require('../config/constants');

// @route POST /api/events
const createEvent = catchAsync(async (req, res) => {
  const coverImage = req.file ? await uploadBuffer(req.file.buffer, 'events') : undefined;

  const event = await Event.create({ ...req.body, coverImage, organizedBy: req.user._id });

  const residents = await User.find({ role: ROLES.RESIDENT, isArchived: false, isActive: true }).select('_id');
  await notifyRole({
    recipients: residents.map((r) => r._id),
    role: ROLES.RESIDENT,
    type: NOTIFICATION_TYPE.EVENT,
    title: 'New community event',
    message: event.title,
    link: `/events/${event._id}`,
    relatedId: event._id,
  });

  res.status(201).json(new ApiResponse(201, event, 'Event created successfully'));
});

// @route GET /api/events
const getAllEvents = catchAsync(async (req, res) => {
  const baseFilter = { isArchived: req.query.archived === 'true' };
  const features = new ApiFeatures(Event.find(baseFilter).populate('organizedBy', 'firstName lastName'), req.query)
    .search(['title', 'description', 'location'])
    .filter()
    .sort()
    .paginate();

  const [items, total] = await Promise.all([
    features.query,
    Event.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/events/:id
const getEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('organizedBy', 'firstName lastName position');
  if (!event) throw ApiError.notFound('Event not found');

  let isRegistered = false;
  if (req.user) {
    isRegistered = Boolean(await EventRegistration.exists({ event: event._id, resident: req.user._id }));
  }

  res.status(200).json(new ApiResponse(200, { ...event.toObject(), isRegistered }));
});

// @route PATCH /api/events/:id
const updateEvent = catchAsync(async (req, res) => {
  const updates = { ...req.body };
  if (req.file) updates.coverImage = await uploadBuffer(req.file.buffer, 'events');

  const event = await Event.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!event) throw ApiError.notFound('Event not found');
  res.status(200).json(new ApiResponse(200, event, 'Event updated successfully'));
});

// @route PATCH /api/events/:id/gallery
const addGalleryImages = catchAsync(async (req, res) => {
  if (!req.files?.length) throw ApiError.badRequest('No images provided');
  const uploaded = await Promise.all(req.files.map((file) => uploadBuffer(file.buffer, 'events/gallery')));

  const event = await Event.findByIdAndUpdate(
    req.params.id,
    { $push: { gallery: { $each: uploaded } } },
    { new: true }
  );
  if (!event) throw ApiError.notFound('Event not found');
  res.status(200).json(new ApiResponse(200, event, 'Gallery updated successfully'));
});

// @route PATCH /api/events/:id/archive
const archiveEvent = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Event,
    moduleName: 'event',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Event archived'));
});

// @route PATCH /api/events/:id/restore
const restoreEvent = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Event,
    moduleName: 'event',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Event restored'));
});

// ---------- Registration / Attendance ----------

// @route POST /api/events/:id/join (resident)
const joinEvent = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');
  if (event.status === EVENT_STATUS.CANCELLED) throw ApiError.badRequest('This event has been cancelled.');

  if (event.capacity > 0) {
    const count = await EventRegistration.countDocuments({ event: event._id });
    if (count >= event.capacity) throw ApiError.badRequest('This event has reached full capacity.');
  }

  const existing = await EventRegistration.findOne({ event: event._id, resident: req.user._id });
  if (existing) throw ApiError.conflict('You are already registered for this event.');

  const registration = await EventRegistration.create({ event: event._id, resident: req.user._id });
  res.status(201).json(new ApiResponse(201, registration, 'Successfully joined the event'));
});

// @route DELETE /api/events/:id/join (resident cancels registration)
const leaveEvent = catchAsync(async (req, res) => {
  const registration = await EventRegistration.findOneAndDelete({ event: req.params.id, resident: req.user._id });
  if (!registration) throw ApiError.notFound('Registration not found');
  res.status(200).json(new ApiResponse(200, null, 'Registration cancelled'));
});

// @route GET /api/events/:id/participants (official)
const getParticipants = catchAsync(async (req, res) => {
  const participants = await EventRegistration.find({ event: req.params.id }).populate(
    'resident',
    'firstName lastName email phone avatar qrCode'
  );
  res.status(200).json(new ApiResponse(200, participants));
});

// @route POST /api/events/:id/checkin (official scans resident QR code)
const checkInAttendance = catchAsync(async (req, res) => {
  const { qrCode } = req.body;
  const resident = await User.findOne({ qrCode });
  if (!resident) throw ApiError.notFound('Invalid QR code - resident not found.');

  const registration = await EventRegistration.findOne({ event: req.params.id, resident: resident._id });
  if (!registration) throw ApiError.notFound('This resident is not registered for this event.');
  if (registration.attendance.isPresent) throw ApiError.conflict('Attendance already recorded for this resident.');

  registration.attendance = { isPresent: true, checkedInAt: new Date(), checkedInBy: req.user._id };
  await registration.save();

  await notifyUser({
    recipient: resident._id,
    type: NOTIFICATION_TYPE.EVENT,
    title: 'Attendance recorded',
    message: 'Your event attendance has been successfully recorded.',
    relatedId: req.params.id,
  });

  res.status(200).json(new ApiResponse(200, registration, `Attendance recorded for ${resident.fullName}`));
});

// @route POST /api/events/:id/certificate (resident downloads their certificate after attending)
const issueCertificate = catchAsync(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw ApiError.notFound('Event not found');

  const registration = await EventRegistration.findOne({ event: event._id, resident: req.user._id });
  if (!registration || !registration.attendance.isPresent) {
    throw ApiError.forbidden('Certificate is only available to residents who attended the event.');
  }

  const pdfBuffer = await generateCertificatePdf({
    residentName: req.user.fullName,
    eventTitle: event.title,
    eventDate: event.startDate.toDateString(),
    barangayName: req.user.address?.barangay,
  });

  const uploaded = await uploadPdfBuffer(pdfBuffer, 'certificates', `cert-${registration._id}`);
  registration.certificateIssued = true;
  registration.certificateUrl = uploaded.url;
  await registration.save();

  res.status(200).json(new ApiResponse(200, { url: uploaded.url }, 'Certificate generated successfully'));
});

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  addGalleryImages,
  archiveEvent,
  restoreEvent,
  joinEvent,
  leaveEvent,
  getParticipants,
  checkInAttendance,
  issueCertificate,
};
