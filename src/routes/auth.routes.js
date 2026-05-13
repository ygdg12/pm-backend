const express = require("express");
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

// Common mistake: admin list is NOT under /api/auth — return JSON hint instead of plain 404
router.get("/admin/manager/pending", (req, res) => {
  res.status(404).json({
    error: {
      message:
        "Wrong URL. Pending managers are listed at GET /api/admin/managers/pending (note: /api/admin and plural managers). Use Header Authorization: Bearer <token> from POST /api/auth/login — do not send admin email/password in a GET body.",
      code: 404,
      useMethod: "GET",
      usePath: "/api/admin/managers/pending",
    },
  });
});
router.get("/admin/managers/pending", (req, res) => {
  res.status(404).json({
    error: {
      message:
        "Wrong URL prefix. Use GET /api/admin/managers/pending (under /api/admin, not /api/auth/admin). Authorization: Bearer <admin JWT from POST /api/auth/login>.",
      code: 404,
      usePath: "/api/admin/managers/pending",
    },
  });
});

module.exports = router;
