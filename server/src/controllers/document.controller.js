const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Document = require('../models/Document');
const Setting = require('../models/Setting');
const { nextReferenceCode } = require('../utils/referenceCode');
const { generateDocumentPdf } = require('../services/pdf.service');
const { uploadPdfBuffer } = require('../services/cloudinary.service');
const { notifyRole, notifyUser } = require('../services/notification.service');
const { archiveDocument: archiveRecord, restoreDocument: restoreRecord } = require('../services/archive.service');
const { NOTIFICATION_TYPE, ROLES, DOCUMENT_STATUS } = require('../config/constants');

const CLIENT_URL = () => process.env.CLIENT_URL;

// @route POST /api/documents (resident requests a document)
const createDocumentRequest = catchAsync(async (req, res) => {
  const { type, purpose, details } = req.body;

  const categorySettings = await Setting.findOne({ key: 'categories' });
  const fee = categorySettings?.value?.documentFees?.[type] ?? 0;

  const referenceCode = await nextReferenceCode(Document, 'DOC');

  const document = await Document.create({
    referenceCode,
    requestedBy: req.user._id,
    type,
    purpose,
    details: details ? JSON.parse(details) : {},
    fee,
  });

  const officials = await require('../models/User').find({ role: ROLES.OFFICIAL, isArchived: false }).select('_id');
  await notifyRole({
    recipients: officials.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.DOCUMENT,
    title: 'New document request',
    message: `${req.user.fullName} requested a ${type.replace(/_/g, ' ')}.`,
    link: `/official/documents/${document._id}`,
    relatedId: document._id,
  });

  res.status(201).json(new ApiResponse(201, document, 'Document request submitted successfully'));
});

// @route GET /api/documents
const getAllDocuments = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.requestedBy = req.user._id;

  const features = new ApiFeatures(
    Document.find(baseFilter).populate('requestedBy', 'firstName lastName email phone'),
    req.query
  )
    .search(['referenceCode', 'purpose'])
    .filter()
    .sort()
    .paginate();

  const [items, total] = await Promise.all([
    features.query,
    Document.countDocuments({ ...baseFilter, ...features.query.getFilter() }),
  ]);

  res.status(200).json(
    new ApiResponse(200, items, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/documents/:id
const getDocument = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id).populate('requestedBy', 'firstName lastName email phone address');
  if (!document) throw ApiError.notFound('Document request not found');

  if (req.user.role === ROLES.RESIDENT && String(document.requestedBy._id) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only view your own requests.');
  }

  res.status(200).json(new ApiResponse(200, document));
});

// @route PATCH /api/documents/:id/review (official approves or rejects)
const reviewDocument = catchAsync(async (req, res) => {
  const { decision, rejectionReason } = req.body; // decision: 'approved' | 'rejected'
  const document = await Document.findById(req.params.id).populate('requestedBy');
  if (!document) throw ApiError.notFound('Document request not found');
  if (document.status !== DOCUMENT_STATUS.PENDING) throw ApiError.badRequest('This request has already been reviewed.');

  document.reviewedBy = req.user._id;
  document.reviewedAt = new Date();

  if (decision === 'rejected') {
    document.status = DOCUMENT_STATUS.REJECTED;
    document.rejectionReason = rejectionReason;
    await document.save();

    await notifyUser({
      recipient: document.requestedBy._id,
      type: NOTIFICATION_TYPE.DOCUMENT,
      title: 'Document request rejected',
      message: `Your ${document.type.replace(/_/g, ' ')} request was rejected: ${rejectionReason}`,
      link: `/resident/documents/${document._id}`,
      relatedId: document._id,
    });

    return res.status(200).json(new ApiResponse(200, document, 'Document request rejected'));
  }

  // Approved: generate the PDF + QR verification code
  document.status = DOCUMENT_STATUS.APPROVED;
  document.qrCode = document.referenceCode;

  const verifyUrl = `${CLIENT_URL()}/verify-document/${document.referenceCode}`;
  const pdfBuffer = await generateDocumentPdf({
    type: document.type,
    referenceCode: document.referenceCode,
    residentName: document.requestedBy.fullName,
    purpose: document.purpose,
    issuedDate: new Date().toDateString(),
    verifyUrl,
    barangayName: document.requestedBy.address?.barangay,
  });

  const uploaded = await uploadPdfBuffer(pdfBuffer, 'documents', document.referenceCode);
  document.pdfFile = uploaded;
  document.status = DOCUMENT_STATUS.READY;
  document.issuedAt = new Date();
  await document.save();

  await notifyUser({
    recipient: document.requestedBy._id,
    type: NOTIFICATION_TYPE.DOCUMENT,
    title: 'Document ready for download',
    message: `Your ${document.type.replace(/_/g, ' ')} (${document.referenceCode}) is ready.`,
    link: `/resident/documents/${document._id}`,
    relatedId: document._id,
  });

  res.status(200).json(new ApiResponse(200, document, 'Document approved and generated successfully'));
});

// @route PATCH /api/documents/:id/claim (official marks as claimed in person)
const markClaimed = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Document request not found');

  document.status = DOCUMENT_STATUS.CLAIMED;
  document.claimedAt = new Date();
  await document.save();

  res.status(200).json(new ApiResponse(200, document, 'Document marked as claimed'));
});

// @route GET /api/documents/verify/:referenceCode (public - used by QR scanner)
const verifyDocument = catchAsync(async (req, res) => {
  const document = await Document.findOne({ referenceCode: req.params.referenceCode })
    .populate('requestedBy', 'firstName lastName')
    .select('referenceCode type status issuedAt requestedBy purpose');

  if (!document || ![DOCUMENT_STATUS.READY, DOCUMENT_STATUS.CLAIMED].includes(document.status)) {
    throw ApiError.notFound('This document could not be verified. It may be invalid or not yet issued.');
  }

  res.status(200).json(
    new ApiResponse(200, {
      valid: true,
      referenceCode: document.referenceCode,
      type: document.type,
      residentName: document.requestedBy?.fullName,
      issuedAt: document.issuedAt,
      purpose: document.purpose,
    })
  );
});

// @route GET /api/documents/stats/overview
const getDocumentStats = catchAsync(async (_req, res) => {
  const [byStatus, byType, total] = await Promise.all([
    Document.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Document.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Document.countDocuments({ isArchived: false }),
  ]);
  res.status(200).json(new ApiResponse(200, { total, byStatus, byType }));
});

// @route PATCH /api/documents/:id/archive
const archiveDocumentRequest = catchAsync(async (req, res) => {
  const doc = await archiveRecord({
    Model: Document,
    moduleName: 'document',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Document request archived'));
});

// @route PATCH /api/documents/:id/restore
const restoreDocumentRequest = catchAsync(async (req, res) => {
  const doc = await restoreRecord({
    Model: Document,
    moduleName: 'document',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Document request restored'));
});

module.exports = {
  createDocumentRequest,
  getAllDocuments,
  getDocument,
  reviewDocument,
  markClaimed,
  verifyDocument,
  getDocumentStats,
  archiveDocumentRequest,
  restoreDocumentRequest,
};
