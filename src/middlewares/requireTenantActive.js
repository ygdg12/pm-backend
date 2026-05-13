const User = require("../models/User");
const { unauthorized } = require("../utils/httpError");

function requireTenantActive(req, res, next) {
  if (!req.user || req.user.role !== "tenant") return next();

  User.findById(req.user.userId)
    .select("accountStatus role")
    .exec()
    .then((u) => {
      if (!u) return next(unauthorized("Tenant account not found"));
      const allowed = new Set(["active", "pending_lease_request", "approved_awaiting_physical", "active_resident"]);
      const st = u.accountStatus || "active";
      if (!allowed.has(st)) {
        return next(unauthorized("Tenant account cannot use this feature in its current status"));
      }
      req.user.accountStatus = st;
      return next();
    })
    .catch(next);
}

module.exports = { requireTenantActive };

