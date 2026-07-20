/** Wraps an async route handler so rejected promises are forwarded to errorHandler. */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
