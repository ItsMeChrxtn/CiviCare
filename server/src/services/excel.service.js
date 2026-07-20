const ExcelJS = require('exceljs');

/**
 * Builds an in-memory .xlsx workbook from a flat array of objects.
 * @param {{sheetName: string, columns: {header: string, key: string, width?: number}[], rows: object[]}} opts
 * @returns {Promise<Buffer>}
 */
const generateExcelBuffer = async ({ sheetName = 'Sheet1', columns, rows }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns;
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  rows.forEach((row) => sheet.addRow(row));

  return workbook.xlsx.writeBuffer();
};

module.exports = { generateExcelBuffer };
