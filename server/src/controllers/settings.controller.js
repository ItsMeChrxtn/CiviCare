const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const Setting = require('../models/Setting');

const DEFAULTS = {
  general: { barangayName: 'Barangay', address: '', officeHours: '8:00 AM - 5:00 PM, Mon-Fri', logoUrl: '' },
  sms: { enabled: true, senderName: process.env.SEMAPHORE_SENDER_NAME || 'CiviCare' },
  email: { enabled: true, fromName: 'CiviCare Barangay System' },
  faqs: [],
  categories: {
    incidentCategories: ['fire', 'flood', 'earthquake', 'typhoon', 'medical', 'crime', 'accident', 'infrastructure', 'other'],
    documentFees: {
      barangay_clearance: 50,
      certificate_of_residency: 30,
      certificate_of_indigency: 0,
      business_clearance: 100,
      cedula: 30,
    },
  },
};

// @route GET /api/settings/:key
const getSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  const setting = await Setting.findOne({ key });
  res.status(200).json(new ApiResponse(200, setting?.value ?? DEFAULTS[key] ?? null));
});

// @route GET /api/settings (admin - all settings at once)
const getAllSettings = catchAsync(async (_req, res) => {
  const settings = await Setting.find();
  const merged = { ...DEFAULTS };
  settings.forEach((s) => {
    merged[s.key] = s.value;
  });
  res.status(200).json(new ApiResponse(200, merged));
});

// @route PUT /api/settings/:key (admin)
const updateSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  const setting = await Setting.findOneAndUpdate(
    { key },
    { value: req.body, updatedBy: req.user._id },
    { new: true, upsert: true, runValidators: true }
  );
  res.status(200).json(new ApiResponse(200, setting.value, 'Settings updated successfully'));
});

// @route GET /api/settings/backup/export (admin - JSON snapshot of all collections)
const exportBackup = catchAsync(async (_req, res) => {
  const models = require('../models');
  const backup = {};

  for (const [name, Model] of Object.entries(models)) {
    // eslint-disable-next-line no-await-in-loop
    backup[name] = await Model.find().lean();
  }

  res.setHeader('Content-Disposition', `attachment; filename=civicare-backup-${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ generatedAt: new Date(), data: backup }, null, 2));
});

// @route POST /api/settings/backup/restore (admin - restores from an uploaded JSON snapshot)
const restoreBackup = catchAsync(async (req, res) => {
  const models = require('../models');
  const { data } = req.body;

  for (const [name, records] of Object.entries(data || {})) {
    const Model = models[name];
    if (!Model || !Array.isArray(records) || !records.length) continue;
    // eslint-disable-next-line no-await-in-loop
    await Model.deleteMany({});
    // eslint-disable-next-line no-await-in-loop
    await Model.insertMany(records, { ordered: false }).catch(() => {});
  }

  res.status(200).json(new ApiResponse(200, null, 'Backup restored successfully'));
});

module.exports = { getSetting, getAllSettings, updateSetting, exportBackup, restoreBackup };
