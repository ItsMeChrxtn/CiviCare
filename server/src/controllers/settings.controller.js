const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const Setting = require('../models/Setting');
const { createSnapshot, listAutoBackups, resolveAutoBackup, runAutoBackup } = require('../services/backup.service');

const DEFAULTS = {
  general: {
    barangayName: 'Barangay Magdiwang',
    address: 'Barangay Magdiwang, Noveleta, Cavite',
    phone: '',
    email: 'barangaymagdiwang@gmail.com',
    officeHours: 'Monday - Friday, 8:00 AM - 5:00 PM',
    logoUrl: '',
    about:
      'The name "Magdiwang" holds historical significance: Noveleta served as the headquarters of the Magdiwang faction ' +
      'of the Katipunan during the 1896 Philippine Revolution, led by General Mariano Alvarez. Today, Barangay Magdiwang is ' +
      'a residential and community-focused area that continues to provide public services and development programs for its ' +
      'residents, supporting safety, welfare, and civic participation within the community.',
    mapCenter: [14.4318, 120.8852], // Barangay Magdiwang, Noveleta, Cavite
    // Landing page (panel revision): Barangay Hall background photo, mission and vision.
    heroImage: '',
    mission:
      'To deliver efficient, transparent, and responsive public service to every resident of Barangay Magdiwang, ' +
      'and to build a safe, prepared, and united community through active citizen participation.',
    vision:
      'A peaceful, progressive, and disaster-resilient Barangay Magdiwang where every resident is informed, ' +
      'protected, and empowered to take part in community development.',
  },
  // Barangay officials on the landing page: [{ name, position, committee, photo, order }]
  officials: [],
  emergency: {
    floodRiskLevel: 'moderate', // low | moderate | high | critical
    alerts: [
      { key: 'flood', label: 'Flood Alert', level: 'Low', active: true },
      { key: 'typhoon', label: 'Typhoon Advisory', level: 'Signal No. 1', active: true },
      { key: 'fire', label: 'Fire Risk', level: 'Low', active: true },
      { key: 'public_safety', label: 'Public Safety', level: 'Normal', active: true },
    ],
  },
  sms: { enabled: true, senderName: process.env.SEMAPHORE_SENDER_NAME || 'CiviCare' },
  email: { enabled: true, fromName: 'CiviCare Barangay System' },
  faqs: [],
  categories: {
    incidentCategories: ['fire', 'flood', 'earthquake', 'typhoon', 'medical', 'crime', 'accident', 'infrastructure', 'other'],
    // Panel revision: only these two documents are offered, and both are free of charge.
    documentTypes: ['barangay_clearance', 'certificate_of_indigency'],
  },
};

// Stored objects are merged over the defaults so newly added fields (e.g. general.about) still appear.
const withDefaults = (key, value) => {
  const fallback = DEFAULTS[key];
  if (value === undefined || value === null) return fallback ?? null;
  if (fallback && typeof fallback === 'object' && !Array.isArray(fallback) && typeof value === 'object' && !Array.isArray(value)) {
    return { ...fallback, ...value };
  }
  return value;
};

// @route GET /api/settings/:key
const getSetting = catchAsync(async (req, res) => {
  const { key } = req.params;
  const setting = await Setting.findOne({ key });
  res.status(200).json(new ApiResponse(200, withDefaults(key, setting?.value)));
});

// @route PUT /api/settings/emergency (official/admin - alert levels shown in the Emergency Hub)
const updateEmergencyStatus = catchAsync(async (req, res) => {
  const { floodRiskLevel, alerts } = req.body;
  if (floodRiskLevel && !['low', 'moderate', 'high', 'critical'].includes(floodRiskLevel)) {
    throw require('../utils/ApiError').badRequest('Invalid flood risk level');
  }
  const current = withDefaults('emergency', (await Setting.findOne({ key: 'emergency' }))?.value);
  const value = {
    floodRiskLevel: floodRiskLevel || current.floodRiskLevel,
    alerts: Array.isArray(alerts)
      ? alerts.map((a) => ({ key: String(a.key), label: String(a.label), level: String(a.level), active: a.active !== false }))
      : current.alerts,
  };
  await Setting.findOneAndUpdate({ key: 'emergency' }, { value, updatedBy: req.user._id }, { upsert: true });

  const { emitToAll } = require('../config/socket');
  emitToAll('emergency:updated', value);
  await require('../services/log.service').writeLog({
    req,
    action: 'EMERGENCY_STATUS_UPDATE',
    module: 'settings',
    description: `Flood risk set to ${value.floodRiskLevel}`,
  });

  res.status(200).json(new ApiResponse(200, value, 'Emergency status updated'));
});

// @route GET /api/settings (admin - all settings at once)
const getAllSettings = catchAsync(async (_req, res) => {
  const settings = await Setting.find();
  const merged = { ...DEFAULTS };
  settings.forEach((s) => {
    merged[s.key] = withDefaults(s.key, s.value);
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
  await require('../services/log.service').writeLog({
    req,
    action: 'SETTINGS_UPDATE',
    module: 'settings',
    description: `Updated "${key}" settings`,
  });
  res.status(200).json(new ApiResponse(200, setting.value, 'Settings updated successfully'));
});

// @route POST /api/settings/upload (admin - landing page background and officials' photos)
const uploadImage = catchAsync(async (req, res) => {
  if (!req.file) throw require('../utils/ApiError').badRequest('Please choose an image.');
  const { url } = await require('../services/cloudinary.service').uploadBuffer(req.file.buffer, 'settings');
  res.status(201).json(new ApiResponse(201, { url }, 'Image uploaded'));
});

// @route GET /api/settings/backup/export (admin - JSON snapshot of all collections)
const exportBackup = catchAsync(async (_req, res) => {
  const snapshot = await createSnapshot();
  await require('../services/log.service').writeLog({ req: _req, action: 'BACKUP_EXPORT', module: 'backup', description: 'Manual backup downloaded' });

  res.setHeader('Content-Disposition', `attachment; filename=civicare-backup-${Date.now()}.json`);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify(snapshot, null, 2));
});

// @route GET /api/settings/backup/auto (admin - automated daily backups kept on the server)
const getAutoBackups = catchAsync(async (_req, res) => {
  res.status(200).json(new ApiResponse(200, await listAutoBackups()));
});

// @route POST /api/settings/backup/auto (admin - trigger an automated-style backup now)
const runBackupNow = catchAsync(async (req, res) => {
  await runAutoBackup();
  await require('../services/log.service').writeLog({ req, action: 'BACKUP_RUN', module: 'backup', description: 'Server backup created' });
  res.status(201).json(new ApiResponse(201, await listAutoBackups(), 'Backup created'));
});

// @route GET /api/settings/backup/auto/:name (admin - download one stored backup)
const downloadAutoBackup = catchAsync(async (req, res) => {
  const filePath = resolveAutoBackup(req.params.name);
  if (!filePath) throw require('../utils/ApiError').badRequest('Invalid backup name');
  res.download(filePath, req.params.name);
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

  await require('../services/log.service').writeLog({ req, action: 'BACKUP_RESTORE', module: 'backup', description: 'Database restored from backup', level: 'warning' });

  res.status(200).json(new ApiResponse(200, null, 'Backup restored successfully'));
});

module.exports = {
  getSetting,
  getAllSettings,
  updateSetting,
  updateEmergencyStatus,
  uploadImage,
  exportBackup,
  restoreBackup,
  getAutoBackups,
  runBackupNow,
  downloadAutoBackup,
};
