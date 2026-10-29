const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Document = require('../models/Document');
const Setting = require('../models/Setting');
const User = require('../models/User');
const { nextReferenceCode } = require('../utils/referenceCode');
const { generateDocumentPdf } = require('../services/pdf.service');
const { generateQrDataUrl } = require('../services/qrcode.service');
const { uploadBuffer, uploadPdfBuffer } = require('../services/cloudinary.service');
const { notifyRole, notifyUser } = require('../services/notification.service');
const { deliverSms } = require('../services/sms.service');
const { writeLog } = require('../services/log.service');
const { archiveDocument: archiveRecord, restoreDocument: restoreRecord } = require('../services/archive.service');
const { NOTIFICATION_TYPE, ROLES, DOCUMENT_STATUS, REQUESTABLE_DOCUMENT_TYPES } = require('../config/constants');

const CLIENT_URL = () => process.env.CLIENT_URL;
const HASH_SECRET = () => process.env.DOCUMENT_HASH_SECRET || process.env.JWT_ACCESS_SECRET;

const typeLabel = (type) => type.replace(/_/g, ' ');

/**
 * Anti-tampering hash: an HMAC over the fields printed on the issued document.
 * It travels inside the QR code; verification recomputes it server-side, so a
 * QR copied onto an edited/forged document (or an edited hash) fails the check.
 */
const computeVerificationHash = ({ referenceCode, type, residentName, issuedAt }) =>
  crypto
    .createHmac('sha256', HASH_SECRET())
    .update([referenceCode, type, residentName, new Date(issuedAt).toISOString()].join('|'))
    .digest('hex')
    .slice(0, 32);

const residentNameFor = (document) => {
  const d = document.details || {};
  const fromForm = [d.firstName, d.middleName, d.lastName].filter(Boolean).join(' ').trim();
  return fromForm || document.requestedBy?.fullName || '';
};

const parseDetails = (details) => {
  if (!details) return {};
  if (typeof details === 'object') return details;
  try {
    return JSON.parse(details);
  } catch {
    throw ApiError.badRequest('Invalid request details.');
  }
};

// @route POST /api/documents (resident requests a document)
const createDocumentRequest = catchAsync(async (req, res) => {
  const { type, purpose, priority } = req.body;
  if (!REQUESTABLE_DOCUMENT_TYPES.includes(type)) {
    throw ApiError.badRequest('Only Barangay Clearance and Certificate of Indigency can be requested.');
  }
  if (!purpose?.trim()) throw ApiError.badRequest('Purpose of request is required.');

  const details = parseDetails(req.body.details);

  // Valid ID with a Magdiwang address, so officials can verify residency before processing.
  if (!req.file) throw ApiError.badRequest('Please upload a photo of your Barangay ID or any valid ID with your Magdiwang address.');
  const validId = await uploadBuffer(req.file.buffer, 'valid-ids');

  const referenceCode = await nextReferenceCode(Document, 'DOC');

  const document = await Document.create({
    referenceCode,
    requestedBy: req.user._id,
    type,
    purpose,
    details,
    validId,
    priority: priority === 'urgent' ? 'urgent' : 'normal',
    fee: 0, // documents are issued free of charge
  });

  const officials = await User.find({ role: ROLES.OFFICIAL, isArchived: false }).select('_id');
  await notifyRole({
    recipients: officials.map((o) => o._id),
    role: ROLES.OFFICIAL,
    type: NOTIFICATION_TYPE.DOCUMENT,
    title: 'New service request',
    message: `${req.user.fullName} requested a ${typeLabel(type)}.`,
    link: '/official/documents',
    relatedId: document._id,
  });

  await writeLog({ req, action: 'DOCUMENT_REQUEST', module: 'documents', description: `Requested ${referenceCode} (${type})` });

  res.status(201).json(new ApiResponse(201, document, 'Service request submitted successfully'));
});

// @route GET /api/documents
const getAllDocuments = catchAsync(async (req, res) => {
  const isResident = req.user.role === ROLES.RESIDENT;
  const baseFilter = { isArchived: req.query.archived === 'true' };
  if (isResident) baseFilter.requestedBy = req.user._id;

  const features = new ApiFeatures(
    Document.find(baseFilter).select('-scanLogs').populate('requestedBy', 'firstName lastName email phone residentId isRbiVerified'),
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
  const isResident = req.user.role === ROLES.RESIDENT;
  let query = Document.findById(req.params.id).populate(
    'requestedBy',
    'firstName lastName email phone address residentId isRbiVerified'
  );
  if (isResident) query = query.select('-scanLogs');
  const document = await query;
  if (!document) throw ApiError.notFound('Service request not found');

  if (isResident && String(document.requestedBy._id) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only view your own requests.');
  }

  const payload = document.toJSON();
  // Issued documents carry a scannable QR (verify URL + anti-tampering hash) shown on screen.
  if ([DOCUMENT_STATUS.READY, DOCUMENT_STATUS.CLAIMED].includes(document.status) && document.qrCode?.startsWith('http')) {
    payload.qrDataUrl = await generateQrDataUrl(document.qrCode);
  }

  res.status(200).json(new ApiResponse(200, payload));
});

const notifyRequester = async (document, title, message, smsText) => {
  await notifyUser({
    recipient: document.requestedBy._id,
    type: NOTIFICATION_TYPE.DOCUMENT,
    title,
    message,
    link: `/resident/documents/${document._id}`,
    relatedId: document._id,
  });
  if (smsText) deliverSms({ numbers: document.requestedBy.phone, purpose: 'document', message: smsText });
};

// @route PATCH /api/documents/:id/process (official starts working on the request)
const markProcessing = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id).populate('requestedBy');
  if (!document) throw ApiError.notFound('Service request not found');
  if (document.status !== DOCUMENT_STATUS.PENDING) throw ApiError.badRequest('Only pending requests can be processed.');

  document.status = DOCUMENT_STATUS.PROCESSING;
  document.reviewedBy = req.user._id;
  await document.save();

  await notifyRequester(
    document,
    'Service request in process',
    `Your ${typeLabel(document.type)} (${document.referenceCode}) is now being processed.`,
    `[CiviCare] Your ${typeLabel(document.type)} request ${document.referenceCode} is now being processed.`
  );
  await writeLog({ req, action: 'DOCUMENT_PROCESS', module: 'documents', description: `${document.referenceCode} processing` });

  res.status(200).json(new ApiResponse(200, document, 'Request marked as processing'));
});

// @route PATCH /api/documents/:id/review (official approves or rejects)
const reviewDocument = catchAsync(async (req, res) => {
  const { decision, rejectionReason } = req.body; // decision: 'approved' | 'rejected'
  const document = await Document.findById(req.params.id).populate('requestedBy');
  if (!document) throw ApiError.notFound('Service request not found');
  if (![DOCUMENT_STATUS.PENDING, DOCUMENT_STATUS.PROCESSING].includes(document.status)) {
    throw ApiError.badRequest('This request has already been reviewed.');
  }

  document.reviewedBy = req.user._id;
  document.reviewedAt = new Date();

  if (decision === 'rejected') {
    document.status = DOCUMENT_STATUS.REJECTED;
    document.rejectionReason = rejectionReason;
    await document.save();

    await notifyRequester(
      document,
      'Service request rejected',
      `Your ${typeLabel(document.type)} request was rejected: ${rejectionReason}`,
      `[CiviCare] Your ${typeLabel(document.type)} request ${document.referenceCode} was not approved. Reason: ${
        rejectionReason || 'please visit the Barangay Hall'
      }`
    );
    await writeLog({ req, action: 'DOCUMENT_REJECT', module: 'documents', description: `${document.referenceCode} rejected` });

    return res.status(200).json(new ApiResponse(200, document, 'Service request rejected'));
  }

  // Approved: sign + generate the PDF with an anti-tampering QR code.
  const issuedAt = new Date();
  const residentName = residentNameFor(document);
  const verificationHash = computeVerificationHash({
    referenceCode: document.referenceCode,
    type: document.type,
    residentName,
    issuedAt,
  });
  const verifyUrl = `${CLIENT_URL()}/verify-document/${document.referenceCode}?h=${verificationHash}`;

  const general = await Setting.findOne({ key: 'general' }).lean();
  const pdfBuffer = await generateDocumentPdf({
    type: document.type,
    referenceCode: document.referenceCode,
    residentName,
    purpose: document.purpose,
    issuedDate: issuedAt.toDateString(),
    verifyUrl,
    barangayName: general?.value?.barangayName || 'Barangay Magdiwang',
  });

  document.pdfFile = await uploadPdfBuffer(pdfBuffer, 'documents', document.referenceCode);
  document.qrCode = verifyUrl;
  document.verificationHash = verificationHash;
  document.status = DOCUMENT_STATUS.READY;
  document.issuedAt = issuedAt;
  await document.save();

  await notifyRequester(
    document,
    'Document ready for pick-up',
    `Your ${typeLabel(document.type)} (${document.referenceCode}) is ready.`,
    `[CiviCare] Your ${typeLabel(document.type)} ${document.referenceCode} is ready for pick-up at the Barangay Hall. Verify: ${verifyUrl}`
  );
  await writeLog({ req, action: 'DOCUMENT_APPROVE', module: 'documents', description: `${document.referenceCode} approved and issued` });

  res.status(200).json(new ApiResponse(200, document, 'Document approved and generated successfully'));
});

// @route PATCH /api/documents/:id/priority (official triage: normal | urgent)
const setPriority = catchAsync(async (req, res) => {
  const { priority } = req.body;
  if (!['normal', 'urgent'].includes(priority)) throw ApiError.badRequest('Priority must be normal or urgent');
  const document = await Document.findByIdAndUpdate(req.params.id, { priority }, { new: true });
  if (!document) throw ApiError.notFound('Service request not found');
  res.status(200).json(new ApiResponse(200, document, `Priority set to ${priority}`));
});

// @route PATCH /api/documents/:id/claim (official marks as claimed in person)
const markClaimed = catchAsync(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) throw ApiError.notFound('Service request not found');

  document.status = DOCUMENT_STATUS.CLAIMED;
  document.claimedAt = new Date();
  await document.save();

  await writeLog({ req, action: 'DOCUMENT_CLAIM', module: 'documents', description: `${document.referenceCode} claimed` });

  res.status(200).json(new ApiResponse(200, document, 'Document marked as claimed'));
});

// @route GET /api/documents/verify/:referenceCode?h=<hash> (public - used by QR scanner)
const verifyDocument = catchAsync(async (req, res) => {
  const document = await Document.findOne({ referenceCode: req.params.referenceCode })
    .select('+verificationHash referenceCode type status issuedAt requestedBy purpose details')
    .populate('requestedBy', 'firstName lastName');

  const logScan = (result) =>
    document &&
    Document.updateOne(
      { _id: document._id },
      { $push: { scanLogs: { result, ipAddress: req.ip, userAgent: req.headers['user-agent'] } } }
    ).catch(() => {});

  if (!document || ![DOCUMENT_STATUS.READY, DOCUMENT_STATUS.CLAIMED].includes(document.status)) {
    await logScan('invalid');
    throw ApiError.notFound('This document could not be verified. It may be invalid or not yet issued.');
  }

  // Documents issued before hashing existed have no stored hash; they verify by reference code alone.
  const provided = String(req.query.h || '');
  const expected = document.verificationHash;

  if (expected && !provided) {
    await logScan('invalid');
    throw ApiError.badRequest(
      'This document has a security code. Please scan the QR code printed on it to verify its authenticity.'
    );
  }

  const hashOk =
    !expected ||
    (provided.length === expected.length && crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected)));

  await logScan(hashOk ? 'valid' : 'tampered');

  if (!hashOk) {
    throw ApiError.badRequest(
      'Verification failed: the security code on this document does not match our records. It may have been altered.'
    );
  }

  res.status(200).json(
    new ApiResponse(200, {
      valid: true,
      referenceCode: document.referenceCode,
      type: document.type,
      residentName: residentNameFor(document),
      issuedAt: document.issuedAt,
      purpose: document.purpose,
      status: document.status,
      verifiedAt: new Date(),
    })
  );
});

// @route GET /api/documents/stats/overview
const getDocumentStats = catchAsync(async (_req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const [byStatus, byType, total, approvedToday, processedThisMonth] = await Promise.all([
    Document.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Document.aggregate([{ $match: { isArchived: false } }, { $group: { _id: '$type', count: { $sum: 1 } } }]),
    Document.countDocuments({ isArchived: false }),
    Document.countDocuments({ issuedAt: { $gte: startOfDay } }),
    Document.countDocuments({ reviewedAt: { $gte: startOfMonth } }),
  ]);
  res.status(200).json(new ApiResponse(200, { total, byStatus, byType, approvedToday, processedThisMonth }));
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
  res.status(200).json(new ApiResponse(200, doc, 'Service request archived'));
});

// @route PATCH /api/documents/:id/restore
const restoreDocumentRequest = catchAsync(async (req, res) => {
  const doc = await restoreRecord({
    Model: Document,
    moduleName: 'document',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Service request restored'));
});

module.exports = {
  createDocumentRequest,
  getAllDocuments,
  getDocument,
  markProcessing,
  setPriority,
  reviewDocument,
  markClaimed,
  verifyDocument,
  getDocumentStats,
  archiveDocumentRequest,
  restoreDocumentRequest,
  computeVerificationHash,
};
