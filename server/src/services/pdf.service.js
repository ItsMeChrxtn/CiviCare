const PDFDocument = require('pdfkit');
const { generateQrDataUrl } = require('./qrcode.service');

const DOCUMENT_TITLES = {
  barangay_clearance: 'BARANGAY CLEARANCE',
  certificate_of_residency: 'CERTIFICATE OF RESIDENCY',
  certificate_of_indigency: 'CERTIFICATE OF INDIGENCY',
  business_clearance: 'BUSINESS CLEARANCE',
  cedula: 'COMMUNITY TAX CERTIFICATE (CEDULA)',
};

const DOCUMENT_BODY = {
  barangay_clearance: (name, purpose) =>
    `This is to certify that ${name}, is a bonafide resident of this Barangay and is known to be of good moral character, ` +
    `and has no derogatory/pending case record filed in this office as of this date. ` +
    `This certification is being issued upon the request of the above-named person for ${purpose}.`,
  certificate_of_residency: (name, purpose) =>
    `This is to certify that ${name}, is a bonafide resident of this Barangay. ` +
    `This certification is being issued upon request for ${purpose}.`,
  certificate_of_indigency: (name, purpose) =>
    `This is to certify that ${name}, belongs to an indigent family in this Barangay. ` +
    `This certification is being issued upon request for ${purpose}.`,
  business_clearance: (name, purpose) =>
    `This is to certify that the business operated by ${name} within this Barangay has been inspected and ` +
    `found to be compliant with barangay ordinances. This clearance is issued for ${purpose}.`,
  cedula: (name, purpose) =>
    `This certifies that ${name}, a resident of this Barangay, has paid the corresponding community tax for the current year. ` +
    `Issued for ${purpose}.`,
};

/**
 * Renders an official barangay document to a PDF buffer, embedding a QR code
 * that resolves to the public verification URL for that document.
 */
const generateDocumentPdf = async ({ type, referenceCode, residentName, purpose, issuedDate, verifyUrl, barangayName }) => {
  const qrDataUrl = await generateQrDataUrl(verifyUrl);
  const qrImage = Buffer.from(qrDataUrl.split(',')[1], 'base64');

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 60 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(10).text('Republic of the Philippines', { align: 'center' });
    doc.text(`Office of the ${barangayName || 'Barangay'}`, { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(18).font('Helvetica-Bold').text(DOCUMENT_TITLES[type] || 'CERTIFICATE', { align: 'center' });
    doc.moveDown(2);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text((DOCUMENT_BODY[type] || DOCUMENT_BODY.barangay_clearance)(residentName, purpose), {
        align: 'justify',
        lineGap: 6,
      });

    doc.moveDown(2);
    doc.text(`Issued this ${issuedDate} at the Barangay Hall.`, { align: 'justify' });

    doc.moveDown(4);
    doc.text('_____________________________', { align: 'right' });
    doc.text('Barangay Captain', { align: 'right' });

    doc.moveDown(2);
    doc.fontSize(9).text(`Reference Code: ${referenceCode}`, 60, doc.y);
    doc.image(qrImage, doc.page.width - 160, doc.y - 10, { width: 90 });
    doc.fontSize(8).text('Scan to verify authenticity', doc.page.width - 160, doc.y + 5, { width: 90, align: 'center' });

    doc.end();
  });
};

/** Renders a landscape certificate of participation for an event attendee. */
const generateCertificatePdf = async ({ residentName, eventTitle, eventDate, barangayName }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.lineWidth(3).rect(20, 20, doc.page.width - 40, doc.page.height - 40).stroke('#0f766e');

    doc.fontSize(10).font('Helvetica').text(barangayName || 'Barangay', { align: 'center' });
    doc.moveDown(2);
    doc.fontSize(28).font('Helvetica-Bold').text('CERTIFICATE OF PARTICIPATION', { align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(12).font('Helvetica').text('This certificate is proudly presented to', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(22).font('Helvetica-Bold').text(residentName, { align: 'center' });
    doc.moveDown(0.5);
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`for actively participating in "${eventTitle}" held on ${eventDate}.`, { align: 'center' });

    doc.moveDown(4);
    doc.text('_____________________________', 100, doc.y, { align: 'left' });
    doc.text('Barangay Captain', 100, doc.y + 5);

    doc.end();
  });

module.exports = { generateDocumentPdf, generateCertificatePdf };
