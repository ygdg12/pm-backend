const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { uploadSingle } = require("../middlewares/upload");
const { requireTenantActive } = require("../middlewares/requireTenantActive");
const {
  createComplaint,
  listMyComplaints,
  listManagerComplaints,
} = require("../controllers/complaint.controller");

const router = express.Router();

router.post("/", authRequired, requireRole(["tenant"]), requireTenantActive, uploadSingle("photo"), createComplaint);
router.get("/me", authRequired, requireRole(["tenant"]), requireTenantActive, listMyComplaints);
router.get("/", authRequired, requireRole(["manager"]), listManagerComplaints);

module.exports = router;

