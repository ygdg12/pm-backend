const { asyncHandler } = require("../utils/asyncHandler");
const Complaint = require("../models/Complaint");
const Property = require("../models/Property");
const { badRequest, notFound, forbidden } = require("../utils/httpError");
const { uploadBufferToGridFS } = require("../services/gridfs.service");
const { v4: uuidv4 } = require("uuid");

const createComplaint = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const propertyId = b.propertyId || b.property_id;
  const unitId = b.unitId || b.unit_id;
  const title = b.title;
  const category = b.category;
  const description = b.description;
  if (!propertyId || !title || !category) throw badRequest("propertyId, title and category are required");

  const property = await Property.findById(propertyId).exec();
  if (!property) throw notFound("Property not found");

  const files = req.files || {};
  const photoFile = files.photo ? files.photo[0] : null;

  const photoFileId = photoFile
    ? await uploadBufferToGridFS({
        buffer: photoFile.buffer,
        filename: photoFile.originalname,
        contentType: photoFile.mimetype,
      })
    : null;

  const tenant_name = req.user.fullName || req.user.email || "Tenant";

  // We rely on the tenant signing their lease/being approved; login middleware blocks pending tenants.
  const complaint = await Complaint.create({
    request_id: uuidv4(),
    tenantId: req.user.userId,
    tenant_name,
    title,
    category,
    description: description || "",
    photoFileId,
    propertyId: property._id,
    unitId: unitId || property.units?.[0]?._id,
    managerId: property.managerId,
    status: "open",
  });

  res.status(201).json({ complaint });
});

const listMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ tenantId: req.user.userId }).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ complaints });
});

const listManagerComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ managerId: req.user.userId }).sort({ createdAt: -1 }).limit(100).exec();
  res.json({ complaints });
});

module.exports = { createComplaint, listMyComplaints, listManagerComplaints };

