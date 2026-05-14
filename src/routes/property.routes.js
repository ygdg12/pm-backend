const express = require("express");
const { authRequired } = require("../middlewares/auth");
const { requireRole } = require("../middlewares/requireRole");
const { uploadPropertyImagesAny } = require("../middlewares/upload");
const {
  createProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  listMyProperties,
  getPropertyById,
} = require("../controllers/property.controller");

const router = express.Router();

// Search/browse (tenant + visitor + manager sees own listings only via managerId filter)
const { requireTenantActive } = require("../middlewares/requireTenantActive");

// Must be registered before "/:id" so "mine" is not parsed as an ObjectId
router.get("/mine", authRequired, requireRole(["manager"]), listMyProperties);
router.get("/", authRequired, requireRole(["tenant", "visitor", "manager"]), requireTenantActive, listProperties);
router.get("/:id", authRequired, requireRole(["tenant", "visitor", "manager", "admin"]), requireTenantActive, getPropertyById);

// CRUD (property manager)
router.post("/", authRequired, requireRole(["manager"]), uploadPropertyImagesAny(), createProperty);
router.patch("/:id", authRequired, requireRole(["manager"]), uploadPropertyImagesAny(), updateProperty);
router.delete("/:id", authRequired, requireRole(["manager"]), deleteProperty);

module.exports = router;

