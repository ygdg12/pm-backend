const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { initiatePayment, listMyTransactions } = require("../controllers/payment.controller");
const { requireTenantActive } = require("../middlewares/requireTenantActive");
const { requireActiveResident } = require("../middlewares/requireActiveResident");

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

module.exports = router;

