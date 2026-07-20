const ApiError = require('../utils/ApiError');
const Log = require('../models/Log');

/** 404 handler for unmatched routes - placed after all routes in app.js. */
const notFound = (req, _res, next) => {
  next(ApiError.notFound(`Route not found: ${req.originalUrl}`));
};

/** Converts known error types (Mongoose, JWT, Multer) into ApiError, then responds. */
const errorHandler = async (err, req, res, _next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    if (error.name === 'CastError') {
      error = ApiError.badRequest(`Invalid ${error.path}: ${error.value}`);
    } else if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      error = ApiError.conflict(`Duplicate value for ${field}. Please use another value.`);
    } else if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      error = ApiError.badRequest('Validation failed', messages);
    } else if (error.name === 'JsonWebTokenError') {
      error = ApiError.unauthorized('Invalid token');
    } else if (error.name === 'TokenExpiredError') {
      error = ApiError.unauthorized('Token expired');
    } else if (error.name === 'MulterError') {
      error = ApiError.badRequest(error.message);
    } else {
      error = new ApiError(error.statusCode || 500, error.message || 'Something went wrong');
    }
  }

  if (error.statusCode >= 500) {
    console.error('[ERROR]', err);
    try {
      await Log.create({
        actor: req.user?._id,
        actorRole: req.user?.role,
        action: 'SERVER_ERROR',
        module: 'system',
        description: error.message,
        level: 'error',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        meta: { path: req.originalUrl, method: req.method },
      });
    } catch {
      // avoid crashing the error handler if logging itself fails
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message,
    errors: error.errors || [],
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
