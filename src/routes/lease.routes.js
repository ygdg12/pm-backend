const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  getLeasesForMe,
  getLeaseById,
  signLeaseTenant,
  signLeaseManager,
} = require("../controllers/lease.controller");

const router = express.Router();

router.get("/me", authRequired, requireRole(["tenant", "manager"]), getLeasesForMe);
router.get("/:id", authRequired, requireRole(["tenant", "manager", "admin"]), getLeaseById);

router.post("/:id/sign/tenant", authRequired, requireRole(["tenant"]), signLeaseTenant);
router.post("/:id/sign/manager", authRequired, requireRole(["manager"]), signLeaseManager);

module.exports = router;

