const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Hazard = require('../models/Hazard');
const { archiveDocument, restoreDocument } = require('../services/archive.service');

// @route GET /api/hazards (public - powers the Hazard Map + Emergency Hub evacuation map)
const getAllHazards = catchAsync(async (req, res) => {
  const filter = { isArchived: false, isActive: true };
  if (req.query.layer) filter.layer = req.query.layer;
  const hazards = await Hazard.find(filter).populate('createdBy', 'firstName lastName');
  res.status(200).json(new ApiResponse(200, hazards));
});

// @route GET /api/hazards/:id
const getHazard = catchAsync(async (req, res) => {
  const hazard = await Hazard.findById(req.params.id);
  if (!hazard) throw ApiError.notFound('Hazard feature not found');
  res.status(200).json(new ApiResponse(200, hazard));
});

// @route POST /api/hazards (official/admin)
const createHazard = catchAsync(async (req, res) => {
  const hazard = await Hazard.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(new ApiResponse(201, hazard, 'Hazard map feature added successfully'));
});

// @route PATCH /api/hazards/:id
const updateHazard = catchAsync(async (req, res) => {
  const hazard = await Hazard.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!hazard) throw ApiError.notFound('Hazard feature not found');
  res.status(200).json(new ApiResponse(200, hazard, 'Hazard map feature updated'));
});

// @route PATCH /api/hazards/:id/archive
const archiveHazard = catchAsync(async (req, res) => {
  const doc = await archiveDocument({
    Model: Hazard,
    moduleName: 'hazard',
    id: req.params.id,
    performedBy: req.user._id,
    reason: req.body.reason,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Hazard feature archived'));
});

// @route PATCH /api/hazards/:id/restore
const restoreHazard = catchAsync(async (req, res) => {
  const doc = await restoreDocument({
    Model: Hazard,
    moduleName: 'hazard',
    id: req.params.id,
    performedBy: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, doc, 'Hazard feature restored'));
});

module.exports = { getAllHazards, getHazard, createHazard, updateHazard, archiveHazard, restoreHazard };
