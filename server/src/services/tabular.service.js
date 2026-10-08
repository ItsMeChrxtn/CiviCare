const PDFDocument = require('pdfkit');

const formatCell = (value) => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'object') return value.toString?.() === '[object Object]' ? JSON.stringify(value) : String(value);
  return String(value);
};

/** RFC 4180 CSV with a UTF-8 BOM so Excel opens Filipino names (ñ) correctly. */
const generateCsv = ({ columns, rows }) => {
  const escape = (v) => {
    const s = formatCell(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => escape(c.header)).join(',')];
  rows.forEach((row) => lines.push(columns.map((c) => escape(row[c.key])).join(',')));
  return `﻿${lines.join('\r\n')}`;
};

/** Simple landscape table report for submitting to the municipal LGU. */
const generateTablePdf = ({ title, subtitle, columns, rows }) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const usable = doc.page.width - 72;
    const colWidth = usable / columns.length;
    const left = 36;

    doc.font('Helvetica-Bold').fontSize(14).text(title, { align: 'center' });
    if (subtitle) doc.font('Helvetica').fontSize(9).text(subtitle, { align: 'center' });
    doc.moveDown();

    const drawRow = (cells, bold) => {
      const y = doc.y;
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
      const heights = cells.map((cell) => doc.heightOfString(cell, { width: colWidth - 6 }));
      const h = Math.max(...heights, 10) + 6;
      if (y + h > doc.page.height - 36) {
        doc.addPage();
        return drawRow(cells, bold);
      }
      cells.forEach((cell, i) => doc.text(cell, left + i * colWidth + 3, y + 3, { width: colWidth - 6 }));
      doc.moveTo(left, y + h).lineTo(left + usable, y + h).lineWidth(0.5).strokeColor('#cbd5e1').stroke();
      doc.y = y + h;
      return null;
    };

    drawRow(columns.map((c) => c.header), true);
    rows.forEach((row) => drawRow(columns.map((c) => formatCell(row[c.key]))));
    doc.moveDown().font('Helvetica').fontSize(8).text(`Total records: ${rows.length}`, left);
    doc.end();
  });

module.exports = { generateCsv, generateTablePdf };
