const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const {
  loginController,
  registerManagerController,
  registerVisitorController,
  registerTenantController,
} = require("../controllers/auth.controller");
const { uploadFields } = require("../middlewares/upload");
const { maybeMultipart } = require("../middlewares/maybeMultipart");

const router = express.Router();

// Public
router.post("/login", loginController);

// Property Manager self-registration (admin approval required)
// multipart/form-data: text fields + two image files, OR application/json: see controller (base64 proofs)
router.post(
  "/register/manager",
  maybeMultipart(
    uploadFields([
      { name: "propertyOwnershipProof", maxCount: 1 },
      { name: "telebirrMerchantAccountProof", maxCount: 1 },
    ])
  ),
  registerManagerController
);

// Visitor self-registration (read-only)
router.post("/register/visitor", registerVisitorController);

// Tenant self-registration (same flow as visitor; kebeleId required)
router.post("/register/tenant", registerTenantController);

module.exports = router;

