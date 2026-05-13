const { forbidden } = require("../utils/httpError");

function requireRole(allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !req.user.role) {
      return next(forbidden("Missing user role"));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(forbidden("Insufficient role"));
    }
    return next();
  };
}

module.exports = { requireRole };

