const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Runs after an express-validator chain; short-circuits with a 400 if any rule failed. */
const validate = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const formatted = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.badRequest('Validation failed', formatted));
};

module.exports = validate;
