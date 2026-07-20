const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

/** Generates a random opaque code (used as User.qrCode / Document.qrCode payload). */
const generateCode = () => uuidv4();

/** Renders a QR code as a base64 PNG data URL, ready to embed directly in a PDF or <img>. */
const generateQrDataUrl = async (payload) =>
  QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 300 });

/** Renders a QR code as a PNG buffer, e.g. for embedding into a PDFKit document. */
const generateQrBuffer = async (payload) =>
  QRCode.toBuffer(payload, { errorCorrectionLevel: 'M', margin: 1, width: 300 });

module.exports = { generateCode, generateQrDataUrl, generateQrBuffer };
