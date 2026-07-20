const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const ApiFeatures = require('../utils/ApiFeatures');

/**
 * Generic CRUD handler factory for simple, self-contained resources
 * (Hotline, Permission, Chatbot nodes, ...) so identical create/list/update/
 * delete logic isn't rewritten in every controller.
 */

const createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json(new ApiResponse(201, doc, `${Model.modelName} created successfully`));
  });

const getAll = (Model, { searchFields = [], populate = '' } = {}) =>
  catchAsync(async (req, res) => {
    let query = Model.find();
    if (populate) query = query.populate(populate);

    const features = new ApiFeatures(query, req.query)
      .search(searchFields)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const [docs, total] = await Promise.all([
      features.query,
      Model.countDocuments(features.query.getFilter()),
    ]);

    res.status(200).json(
      new ApiResponse(200, docs, 'Fetched successfully', {
        ...features.pagination,
        total,
        totalPages: Math.ceil(total / features.pagination.limit),
      })
    );
  });

const getOne = (Model, { populate = '' } = {}) =>
  catchAsync(async (req, res) => {
    let query = Model.findById(req.params.id);
    if (populate) query = query.populate(populate);
    const doc = await query;
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    res.status(200).json(new ApiResponse(200, doc));
  });

const updateOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    res.status(200).json(new ApiResponse(200, doc, `${Model.modelName} updated successfully`));
  });

const deleteOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) throw ApiError.notFound(`${Model.modelName} not found`);
    res.status(200).json(new ApiResponse(200, null, `${Model.modelName} deleted successfully`));
  });

module.exports = { createOne, getAll, getOne, updateOne, deleteOne };
