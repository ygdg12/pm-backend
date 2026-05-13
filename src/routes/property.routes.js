const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { uploadPropertyImagesAny } = require("../middlewares/upload");
const {
  createProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  getPropertyById,
} = require("../controllers/property.controller");

const router = express.Router();

// Search/browse (tenant + visitor)
const { requireTenantActive } = require("../middlewares/requireTenantActive");

router.get("/", authRequired, requireRole(["tenant", "visitor"]), requireTenantActive, listProperties);
router.get("/:id", authRequired, requireRole(["tenant", "visitor", "manager", "admin"]), requireTenantActive, getPropertyById);

// CRUD (property manager)
router.post("/", authRequired, requireRole(["manager"]), uploadPropertyImagesAny(), createProperty);
router.patch("/:id", authRequired, requireRole(["manager"]), uploadPropertyImagesAny(), updateProperty);
router.delete("/:id", authRequired, requireRole(["manager"]), deleteProperty);

module.exports = router;

