const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const Complaint = require("../models/Complaint");
const Property = require("../models/Property");
const { badRequest, notFound, forbidden } = require("../utils/httpError");
const { uploadBufferToGridFS } = require("../services/gridfs.service");
const { v4: uuidv4 } = require("uuid");

const COMPLAINT_STATUSES = ["open", "under_review", "in_progress", "resolved"];

const STATUS_DISPLAY = {
  open: "Open",
  under_review: "Under review",
  in_progress: "In progress",
  resolved: "Resolved",
};

function complaintLookupQuery(idParam) {
  const s = String(idParam || "").trim();
  if (!s) return null;
  if (/^[a-fA-F0-9]{24}$/.test(s)) return { _id: new mongoose.Types.ObjectId(s) };
  return { request_id: s };
}

function withComplaintDisplay(doc) {
  const o = doc.toObject ? doc.toObject() : { ...doc };
  o.statusDisplay = STATUS_DISPLAY[o.status] || o.status;
  return o;
}

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

  res.status(201).json({ complaint: withComplaintDisplay(complaint) });
});

const listMyComplaints = asyncHandler(async (req, res) => {
  const q = { tenantId: req.user.userId };
  const idParam = req.query.id || req.query.complaintId || req.query.complaint_id;
  if (idParam) {
    const sub = complaintLookupQuery(idParam);
    if (!sub) throw badRequest("Invalid id");
    Object.assign(q, sub);
  }
  const complaints = await Complaint.find(q).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ complaints: complaints.map((c) => withComplaintDisplay(c)) });
});

const listManagerComplaints = asyncHandler(async (req, res) => {
  const q = { managerId: req.user.userId };
  const idParam = req.query.id || req.query.complaintId || req.query.complaint_id;
  if (idParam) {
    const sub = complaintLookupQuery(idParam);
    if (!sub) throw badRequest("Invalid id");
    Object.assign(q, sub);
  }
  const complaints = await Complaint.find(q).sort({ createdAt: -1 }).limit(100).exec();
  res.json({ complaints: complaints.map((c) => withComplaintDisplay(c)) });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lookup = complaintLookupQuery(id);
  if (!lookup) throw badRequest("Invalid complaint id");

  const complaint = await Complaint.findOne(lookup).exec();
  if (!complaint) throw notFound("Complaint not found");

  const uid = req.user.userId;
  const role = req.user.role;
  if (role === "tenant" && complaint.tenantId.toString() !== uid) throw forbidden("Not allowed");
  if (role === "manager" && complaint.managerId.toString() !== uid) throw forbidden("Not allowed");
  if (role !== "tenant" && role !== "manager") throw forbidden("Not allowed");

  res.json({ complaint: withComplaintDisplay(complaint) });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lookup = complaintLookupQuery(id);
  if (!lookup) throw badRequest("Invalid complaint id");

  const complaint = await Complaint.findOne(lookup).exec();
  if (!complaint) throw notFound("Complaint not found");
  if (complaint.managerId.toString() !== req.user.userId) throw forbidden("Not allowed");

  const b = req.body || {};
  const status = String(b.status || "").trim();
  if (!status) throw badRequest("status is required");
  if (!COMPLAINT_STATUSES.includes(status)) {
    throw badRequest(`status must be one of: ${COMPLAINT_STATUSES.join(", ")}`);
  }

  const noteKeyPresent = b.managerNote !== undefined || b.manager_note !== undefined;
  complaint.status = status;
  if (noteKeyPresent) {
    complaint.managerNote = String(b.managerNote ?? b.manager_note ?? "").trim();
  } else if (status === "under_review" && !(complaint.managerNote && String(complaint.managerNote).trim())) {
    complaint.managerNote = "Your complaint is under review.";
  }
  await complaint.save();

  res.json({
    complaint: withComplaintDisplay(complaint),
    notification: { message: "Complaint status was updated." },
  });
});

module.exports = {
  createComplaint,
  listMyComplaints,
  listManagerComplaints,
  getComplaintById,
  updateComplaintStatus,
};

