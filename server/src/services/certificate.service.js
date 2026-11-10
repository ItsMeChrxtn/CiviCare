const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { generateQrDataUrl } = require('./qrcode.service');

/**
 * Panel revision: the Barangay Certificate is printed on the barangay's own form
 * (assets/templates/barangay-certificate.pdf, US Letter). The resident's details are written
 * onto the blank lines; positions are in PDF points measured from the bottom-left corner.
 */
const TEMPLATE = path.join(__dirname, '../assets/templates/barangay-certificate.pdf');
const TEMPLATE_YEAR = 2026;
const SIZE = 10.4; // the form's own type size
const INK = rgb(0.05, 0.05, 0.25);

// Each purpose key maps to its "( )" box on the form (left edge of the parenthesis, baseline).
const PURPOSE_BOXES = {
  local_employment: [146.9, 407.5],
  travel_abroad: [316.0, 407.5],
  transfer_residence: [146.9, 394.7],
  postal_id: [316.0, 394.7],
  police_clearance: [146.9, 381.8],
  school: [316.0, 381.8],
  nbi_clearance: [146.9, 369.0],
  bank: [316.0, 369.0],
  burial: [146.9, 356.2],
  medical_financial: [315.9, 356.2],
  tricycle_franchise: [146.9, 343.4],
  calamity_aid: [316.0, 343.4],
  other: [146.9, 330.5],
};
const CERTIFICATE_PURPOSES = Object.keys(PURPOSE_BOXES);

const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

// Shrinks text until it fits the blank, so long names and addresses never spill past the line.
const fit = (font, text, max, size = SIZE, min = 7) => {
  let s = size;
  while (s > min && font.widthOfTextAtSize(text, s) > max) s -= 0.25;
  return s;
};

// Splits an address into the two lines the form provides.
const splitLines = (font, text, firstMax, size) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let first = '';
  while (words.length && font.widthOfTextAtSize(`${first} ${words[0]}`.trim(), size) <= firstMax) first = `${first} ${words.shift()}`.trim();
  return [first, words.join(' ')];
};

const generateBarangayCertificatePdf = async ({
  controlNo,
  name,
  address,
  birthdate,
  age,
  placeOfBirth,
  purposeKey,
  purposeText,
  issuedAt,
  issuance = {},
  verifyUrl,
  referenceCode,
}) => {
  const pdf = await PDFDocument.load(fs.readFileSync(TEMPLATE));
  const page = pdf.getPage(0);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const regular = await pdf.embedFont(StandardFonts.TimesRoman);
  const dingbats = await pdf.embedFont(StandardFonts.ZapfDingbats);

  // Writes after a printed label (measured in the form's bold face) and within the blank's width.
  const after = (label, x, y, value, end, { font = bold, size = SIZE, gap = 3 } = {}) => {
    if (!value) return;
    const start = x + bold.widthOfTextAtSize(label, size) + gap;
    const text = String(value);
    page.drawText(text, { x: start, y: y + 1.5, size: fit(font, text, end - start, size), font, color: INK });
  };
  const centered = (value, x1, x2, y, { font = bold, size = SIZE } = {}) => {
    if (!value) return;
    const text = String(value);
    const s = fit(font, text, x2 - x1, size);
    page.drawText(text, { x: x1 + (x2 - x1 - font.widthOfTextAtSize(text, s)) / 2, y: y + 1.5, size: s, font, color: INK });
  };

  // Dates follow Philippine time, whatever time zone the server runs in.
  const local = new Date(issuedAt.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = local.getFullYear();
  // The form has 2026 printed on it; for later years the printed year is covered and replaced.
  if (year !== TEMPLATE_YEAR) {
    const cover = (x, y, w, h) => page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 1, 1) });
    cover(547.2, 631, 22, 11);
    page.drawText(String(year), { x: 547.6, y: 633.2, size: SIZE, font: bold });
    const issuedYearX = 259.2 + bold.widthOfTextAtSize('________________, ', SIZE);
    cover(issuedYearX - 0.5, 264.5, bold.widthOfTextAtSize('2026', SIZE) + 1, 11);
    page.drawText(String(year), { x: issuedYearX, y: 266.4, size: SIZE, font: bold });
    String(year).split('').forEach((digit, i) => {
      const y = [754.0, 730.4, 706.8, 683.3][i];
      cover(554, y - 2, 11, 13);
      page.drawText(digit, { x: 556.1, y, size: 13.2, font: bold, color: rgb(0.55, 0.5, 0.05) });
    });
  }

  // Control No. BC-____-2026
  centered(controlNo, 515.6, 541.5, 633.2, { size: 9 });

  after('NAME:', 113, 484.6, String(name || '').toUpperCase(), 483.7);
  const addressStart = 113 + bold.widthOfTextAtSize('ADDRESS:', SIZE) + 3;
  const addressSize = SIZE;
  const [line1, line2] = splitLines(regular, address, 485 - addressStart, addressSize);
  if (line1) page.drawText(line1, { x: addressStart, y: 473.1, size: addressSize, font: regular, color: INK });
  if (line2) page.drawText(line2, { x: 167, y: 460.3, size: fit(regular, line2, 316, addressSize), font: regular, color: INK });

  const dobStart = 113 + bold.widthOfTextAtSize('DATE OF BIRTH : ', SIZE);
  const ageLabelX = 113 + bold.widthOfTextAtSize('DATE OF BIRTH : ______________________________________ ', SIZE);
  if (birthdate) page.drawText(birthdate, { x: dobStart + 4, y: 447.5, size: fit(regular, birthdate, ageLabelX - dobStart - 10), font: regular, color: INK });
  after('DATE OF BIRTH : ______________________________________ AGE:', 113, 446.0, age, 487.4, { font: regular });
  after('PLACE OF BIRTH:', 113, 433.2, placeOfBirth, 485.8, { font: regular });

  // Check mark inside the matching "( )" box; anything not on the form goes under Others.
  const key = PURPOSE_BOXES[purposeKey] ? purposeKey : 'other';
  const [bx, by] = PURPOSE_BOXES[key];
  page.drawText('✔', { x: bx + 3.6, y: by + 0.5, size: 9, font: dingbats, color: INK });
  if (key === 'other' && purposeText) {
    const start = 160.8 + 42.4 + 4;
    page.drawText(purposeText, { x: start, y: 332, size: fit(regular, purposeText, 485 - start), font: regular, color: INK });
  }

  // "Issued this __ _____ day of ________________, 2026."
  const issuedX = 133.5 + bold.widthOfTextAtSize('Issued this ', SIZE);
  centered(ordinal(local.getDate()), issuedX, issuedX + bold.widthOfTextAtSize('__ _____', SIZE), 266.4);
  const month = issuedAt.toLocaleString('en-US', { month: 'long', timeZone: 'Asia/Manila' });
  centered(month, 259.2, 259.2 + bold.widthOfTextAtSize('________________', SIZE), 266.4);

  // Applicant's printed name over the signature line.
  centered(String(name || '').toUpperCase(), 205, 374, 213.5);

  // Community tax (cedula) and official receipt details entered by the official on approval.
  after('Cedula No.:', 53.4, 183.1, issuance.cedulaNo, 177, { font: regular });
  after('Date Issued:', 53.4, 170.3, issuance.cedulaDateIssued, 179, { font: regular });
  after('Issued at:', 53.4, 157.3, issuance.cedulaIssuedAt, 177, { font: regular });
  after('O.R. No.:', 53.4, 136.3, issuance.orNo, 180, { font: regular, size: 11.3 });

  // Anti-tampering QR, as on every CiviCare document.
  if (verifyUrl) {
    const qrDataUrl = await generateQrDataUrl(verifyUrl);
    const qr = await pdf.embedPng(Buffer.from(qrDataUrl.split(',')[1], 'base64'));
    page.drawImage(qr, { x: 463, y: 196, width: 62, height: 62 });
    const caption = 'Scan to verify';
    page.drawText(caption, { x: 494 - regular.widthOfTextAtSize(caption, 6.5) / 2, y: 189, size: 6.5, font: regular });
    if (referenceCode) page.drawText(referenceCode, { x: 494 - regular.widthOfTextAtSize(referenceCode, 6) / 2, y: 182, size: 6, font: regular });
  }

  return Buffer.from(await pdf.save());
};

module.exports = { generateBarangayCertificatePdf, CERTIFICATE_PURPOSES };
