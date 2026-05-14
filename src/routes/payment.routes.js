const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  initiatePayment,
  listMyTransactions,
  listManagerTransactions,
  uploadPaymentProof,
  reviewPaymentProof,
} = require("../controllers/payment.controller");
const { requireTenantActive } = require("../middlewares/requireTenantActive");
const { requireActiveResident } = require("../middlewares/requireActiveResident");
const { uploadPaymentProofFiles, parseMultipartFormFieldsIfNeeded } = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/telebirr/initiate",
  authRequired,
  requireRole(["tenant"]),
  requireTenantActive,
  requireActiveResident,
  initiatePayment
);
router.get("/me", authRequired, requireRole(["tenant"]), requireTenantActive, listMyTransactions);
router.get("/manager/transactions", authRequired, requireRole(["manager"]), listManagerTransactions);
router.post(
  "/transactions/:id/proof",
  authRequired,
  requireRole(["tenant"]),
  requireTenantActive,
  requireActiveResident,
  uploadPaymentProofFiles(),
  uploadPaymentProof
);
router.patch(
  "/transactions/:id/review",
  authRequired,
  requireRole(["manager"]),
  parseMultipartFormFieldsIfNeeded(),
  reviewPaymentProof
);

module.exports = router;
