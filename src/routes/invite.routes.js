const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  createInviteController,
  getInviteController,
  completeInviteController,
} = require("../controllers/invite.controller");

const router = express.Router();

// Property Manager creates QR invite for a specific unit
router.post("/", authRequired, requireRole(["manager"]), createInviteController);

// Public invite verification + onboarding
router.get("/:token", getInviteController);
router.post("/:token/complete", completeInviteController);

module.exports = router;

