const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  listPendingManagers,
  approveManager,
  rejectManager,
  transactionsSummaryByProperty,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/managers/pending", authRequired, requireRole(["admin"]), listPendingManagers);
router.patch("/managers/:id/approve", authRequired, requireRole(["admin"]), approveManager);
router.patch("/managers/:id/reject", authRequired, requireRole(["admin"]), rejectManager);
router.get("/transactions/summary", authRequired, requireRole(["admin"]), transactionsSummaryByProperty);

module.exports = router;

