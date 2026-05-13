const User = require("../models/User");
const { unauthorized } = require("../utils/httpError");

function requireTenantActive(req, res, next) {
  if (!req.user || req.user.role !== "tenant") return next();

  User.findById(req.user.userId)
    .select("accountStatus role")
    .exec()
    .then((u) => {
      if (!u) return next(unauthorized("Tenant account not found"));
      if (u.accountStatus !== "active") return next(unauthorized("Tenant account not approved yet"));
      req.user.accountStatus = u.accountStatus;
      return next();
    })
    .catch(next);
}

module.exports = { requireTenantActive };

