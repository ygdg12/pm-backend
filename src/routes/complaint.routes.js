const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { uploadSingle, parseMultipartFormFieldsIfNeeded } = require("../middlewares/upload");
const { requireTenantActive } = require("../middlewares/requireTenantActive");
const {
  createComplaint,
  listMyComplaints,
  listManagerComplaints,
  getComplaintById,
  updateComplaintStatus,
} = require("../controllers/complaint.controller");

const router = express.Router();

router.post("/", authRequired, requireRole(["tenant"]), requireTenantActive, uploadSingle("photo"), createComplaint);
router.get("/me", authRequired, requireRole(["tenant"]), requireTenantActive, listMyComplaints);
router.get("/", authRequired, requireRole(["manager"]), listManagerComplaints);
router.get("/:id", authRequired, requireRole(["tenant", "manager"]), requireTenantActive, getComplaintById);
router.patch(
  "/:id",
  authRequired,
  requireRole(["manager"]),
  parseMultipartFormFieldsIfNeeded(),
  updateComplaintStatus
);
router.put(
  "/:id",
  authRequired,
  requireRole(["manager"]),
  parseMultipartFormFieldsIfNeeded(),
  updateComplaintStatus
);

module.exports = router;

