const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  loginController,
  registerManagerMultipartController,
  registerManagerJsonController,
  registerVisitorController,
  registerTenantController,
} = require("../controllers/auth.controller");
const { uploadManagerRegistrationFiles } = require("../middlewares/upload");

const router = express.Router();

// Public
router.post("/login", loginController);

// Property Manager — real file upload (Insomnia: Multipart Form, File fields — not URLs)
router.post("/register/manager", uploadManagerRegistrationFiles(), registerManagerMultipartController);

// Same registration via JSON + base64 (optional; tools that cannot send multipart)
router.post("/register/manager/json", registerManagerJsonController);

// Visitor self-registration (read-only)
router.post("/register/visitor", registerVisitorController);

// Tenant self-registration (same flow as visitor; kebeleId required)
router.post("/register/tenant", registerTenantController);

module.exports = router;
