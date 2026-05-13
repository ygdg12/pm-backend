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

// Typo: singular "manager" — real route is /managers/pending
router.get("/manager/pending", (req, res) => {
  res.status(404).json({
    error: {
      message: "Wrong path. Use GET /api/admin/managers/pending (plural managers).",
      code: 404,
      usePath: "/api/admin/managers/pending",
    },
  });
});

router.get("/managers/pending", authRequired, requireRole(["admin"]), listPendingManagers);
router.patch("/managers/:id/approve", authRequired, requireRole(["admin"]), approveManager);
router.patch("/managers/:id/reject", authRequired, requireRole(["admin"]), rejectManager);
router.get("/transactions/summary", authRequired, requireRole(["admin"]), transactionsSummaryByProperty);

module.exports = router;

