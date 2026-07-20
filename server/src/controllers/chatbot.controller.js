const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Chatbot = require('../models/Chatbot');

// @route GET /api/chatbot/menu?parent=<id|null> (public - rule-based button navigation)
const getMenu = catchAsync(async (req, res) => {
  const parent = req.query.parent && req.query.parent !== 'null' ? req.query.parent : null;
  const nodes = await Chatbot.find({ parent, isActive: true }).sort('order').select('label icon parent');
  res.status(200).json(new ApiResponse(200, nodes));
});

// @route GET /api/chatbot/node/:id (public - selecting a button)
const getNode = catchAsync(async (req, res) => {
  const node = await Chatbot.findById(req.params.id);
  if (!node) throw ApiError.notFound('Topic not found');
  const children = await Chatbot.find({ parent: node._id, isActive: true }).sort('order').select('label icon');
  res.status(200).json(new ApiResponse(200, { ...node.toObject(), children }));
});

// ---------- Admin management ----------

// @route GET /api/chatbot/admin/all
const getAllNodes = catchAsync(async (_req, res) => {
  const nodes = await Chatbot.find().populate('parent', 'label').sort('order');
  res.status(200).json(new ApiResponse(200, nodes));
});

// @route POST /api/chatbot
const createNode = catchAsync(async (req, res) => {
  const node = await Chatbot.create(req.body);
  res.status(201).json(new ApiResponse(201, node, 'Chatbot topic created'));
});

// @route PATCH /api/chatbot/:id
const updateNode = catchAsync(async (req, res) => {
  const node = await Chatbot.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!node) throw ApiError.notFound('Topic not found');
  res.status(200).json(new ApiResponse(200, node, 'Chatbot topic updated'));
});

// @route DELETE /api/chatbot/:id
const deleteNode = catchAsync(async (req, res) => {
  const hasChildren = await Chatbot.exists({ parent: req.params.id });
  if (hasChildren) throw ApiError.badRequest('Delete or reassign child topics first.');

  const node = await Chatbot.findByIdAndDelete(req.params.id);
  if (!node) throw ApiError.notFound('Topic not found');
  res.status(200).json(new ApiResponse(200, null, 'Chatbot topic deleted'));
});

module.exports = { getMenu, getNode, getAllNodes, createNode, updateNode, deleteNode };
