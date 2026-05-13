const User = require("../models/User");
const LeaseAgreement = require("../models/LeaseAgreement");
const { forbidden } = require("../utils/httpError");

function requireActiveResident(req, res, next) {
  if (!req.user || req.user.role !== "tenant") return next();

  Promise.all([
    User.findById(req.user.userId).select("accountStatus role").exec(),
    LeaseAgreement.exists({ tenantId: req.user.userId, status: "approved" }),
  ])
    .then(([u, hasApprovedLease]) => {
      if (!u) return next(forbidden("Tenant account not found"));
      const ok = u.accountStatus === "active_resident" || hasApprovedLease;
      if (!ok) {
        return next(
          forbidden(
            "Rent and deposit payments are only available after in-person lease completion (active resident)"
          )
        );
      }
      req.user.accountStatus = u.accountStatus;
      return next();
    })
    .catch(next);
}

module.exports = { requireActiveResident };
