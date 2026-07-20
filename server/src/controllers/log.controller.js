const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');
const Log = require('../models/Log');
const Archive = require('../models/Archive');

// @route GET /api/logs (admin - audit/system logs)
const getAllLogs = catchAsync(async (req, res) => {
  const features = new ApiFeatures(Log.find().populate('actor', 'firstName lastName email role'), req.query)
    .search(['action', 'description', 'module'])
    .filter()
    .sort()
    .paginate();

  const [logs, total] = await Promise.all([features.query, Log.countDocuments(features.query.getFilter())]);

  res.status(200).json(
    new ApiResponse(200, logs, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

// @route GET /api/logs/archives (admin/official - archive audit trail)
const getAllArchives = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.module) filter.module = req.query.module;

  const features = new ApiFeatures(Archive.find(filter).populate('performedBy', 'firstName lastName role'), req.query)
    .filter()
    .sort()
    .paginate();

  const [archives, total] = await Promise.all([
    features.query,
    Archive.countDocuments(features.query.getFilter()),
  ]);

  res.status(200).json(
    new ApiResponse(200, archives, 'Fetched successfully', {
      ...features.pagination,
      total,
      totalPages: Math.ceil(total / features.pagination.limit),
    })
  );
});

module.exports = { getAllLogs, getAllArchives };
