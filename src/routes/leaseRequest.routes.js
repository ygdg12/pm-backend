const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  uploadLeaseRequestCreateFiles,
  uploadLeaseRequestCompletePhysical,
  uploadLeaseRequestAdditionalDocs,
} = require("../middlewares/upload");
const {
  createLeaseRequest,
  listMyLeaseRequests,
  getLeaseRequestById,
  listManagerLeaseRequests,
  uploadAdditionalDocuments,
  reviewLeaseRequest,
  completePhysicalLease,
} = require("../controllers/leaseRequest.controller");

function completePhysicalUploadIfMultipart(req, res, next) {
  const ct = String(req.headers["content-type"] || "");
  if (ct.toLowerCase().includes("multipart/form-data")) {
    return uploadLeaseRequestCompletePhysical()(req, res, next);
  }
  return next();
}

const router = express.Router();

router.get(
  "/me",
  authRequired,
  requireRole(["tenant"]),
  listMyLeaseRequests
);

router.get(
  "/manager/inbox",
  authRequired,
  requireRole(["manager"]),
  listManagerLeaseRequests
);

router.post(
  "/",
  authRequired,
  requireRole(["tenant"]),
  uploadLeaseRequestCreateFiles(),
  createLeaseRequest
);

router.post(
  "/:id/additional-documents",
  authRequired,
  requireRole(["tenant"]),
  uploadLeaseRequestAdditionalDocs(),
  uploadAdditionalDocuments
);

router.patch(
  "/:id/review",
  authRequired,
  requireRole(["manager"]),
  reviewLeaseRequest
);

router.patch(
  "/:id/complete-physical",
  authRequired,
  requireRole(["manager"]),
  completePhysicalUploadIfMultipart,
  completePhysicalLease
);

router.get(
  "/:id",
  authRequired,
  requireRole(["tenant", "manager", "admin"]),
  getLeaseRequestById
);

module.exports = router;
