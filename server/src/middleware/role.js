const ApiError = require('../utils/ApiError');
const Role = require('../models/Role');

/** Restricts a route to the given built-in role(s), e.g. restrictTo('admin', 'official'). */
const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to perform this action.'));
    }
    next();
  };

/**
 * Fine-grained permission check for custom roles created via Role/Permission
 * collections. Admins always pass. Falls back gracefully if the user's role
 * has no matching Role document (e.g. built-in resident/official/admin).
 */
const requirePermission = (permissionKey) => async (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role === 'admin') return next();

  const role = await Role.findOne({ name: req.user.role }).populate('permissions');
  const allowed = role?.permissions?.some((p) => p.key === permissionKey);

  if (!allowed) return next(ApiError.forbidden('You do not have permission to perform this action.'));
  next();
};

module.exports = { restrictTo, requirePermission };
