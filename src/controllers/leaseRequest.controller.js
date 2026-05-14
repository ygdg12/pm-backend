const mongoose = require("mongoose");
const { asyncHandler } = require("../utils/asyncHandler");
const LeaseRequest = require("../models/LeaseRequest");
const LeaseAgreement = require("../models/LeaseAgreement");
const Property = require("../models/Property");
const User = require("../models/User");
const { uploadBufferToCloudinary } = require("../services/cloudinary.service");
const { badRequest, notFound, forbidden } = require("../utils/httpError");

const PRE_PHYSICAL_OPEN = [
  "pending_review",
  "under_review",
  "additional_documents_requested",
  "meeting_scheduled",
];

const STATUS_DISPLAY = {
  pending_review: "Pending Approval",
  under_review: "Application Under Review",
  additional_documents_requested: "Additional Documents Requested",
  meeting_scheduled: "Meeting Scheduled",
  rejected: "Rejected",
  approved_awaiting_physical: "Approved — Awaiting Physical Verification & Signing",
  completed_active_resident: "Active Resident",
};

function withDisplay(reqDoc) {
  const o = reqDoc.toObject ? reqDoc.toObject() : { ...reqDoc };
  o.statusDisplay = STATUS_DISPLAY[o.status] || o.status;
  return o;
}

async function syncTenantLeaseAccountStatus(tenantId) {
  const user = await User.findById(tenantId).select("role accountStatus").exec();
  if (!user || user.role !== "tenant") return;

  const [completed, awaiting, open] = await Promise.all([
    LeaseRequest.exists({ tenantId, status: "completed_active_resident" }),
    LeaseRequest.exists({ tenantId, status: "approved_awaiting_physical" }),
    LeaseRequest.exists({ tenantId, status: { $in: PRE_PHYSICAL_OPEN } }),
  ]);

  let next = "active";
  if (open) next = "pending_lease_request";
  else if (awaiting) next = "approved_awaiting_physical";
  else if (completed) next = "active_resident";

  if (user.accountStatus !== next) {
    await User.findByIdAndUpdate(tenantId, { accountStatus: next }).exec();
  }
}

function normField(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function firstUploadedBuffer(files, names) {
  if (!files || !files.length) return null;
  const wanted = new Set(names.map((n) => normField(n)));
  for (const f of files) {
    if (!f.buffer) continue;
    if (wanted.has(normField(f.fieldname))) return f;
  }
  return null;
}

function collectFieldFiles(files, names) {
  if (!files || !files.length) return [];
  const wanted = new Set(names.map((n) => normField(n)));
  return files.filter((f) => wanted.has(normField(f.fieldname)) && f.buffer);
}

function parseDate(v, label) {
  if (v === undefined || v === null || v === "") throw badRequest(`${label} is required`);
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw badRequest(`Invalid ${label}`);
  return d;
}

function parsePositiveInt(v, label) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) throw badRequest(`${label} must be a positive number`);
  return Math.floor(n);
}

function getUnitOrThrow(property, unitId) {
  const idStr = String(unitId);
  const unit = property.units.find((u) => String(u._id) === idStr);
  if (!unit) throw notFound("Unit not found on this property");
  return unit;
}

async function assertNoDuplicateOpenRequest(tenantId, propertyId, unitId) {
  const exists = await LeaseRequest.findOne({
    tenantId,
    propertyId,
    unitId,
    status: { $in: [...PRE_PHYSICAL_OPEN, "approved_awaiting_physical"] },
  })
    .select("_id")
    .exec();
  if (exists) throw badRequest("You already have an application in progress for this unit");
}

async function setUnitAvailability(propertyId, unitId, available) {
  const prop = await Property.findById(propertyId).exec();
  if (!prop) throw notFound("Property not found");
  const unit = prop.units.id(unitId);
  if (!unit) throw notFound("Unit not found");
  unit.availability = available;
  await prop.save();
}

const createLeaseRequest = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const propertyId = b.propertyId || b.property_id;
  const unitId = b.unitId || b.unit_id;
  if (!propertyId || !unitId) throw badRequest("propertyId and unitId are required");

  const desiredMoveInDate = parseDate(b.desiredMoveInDate || b.desired_move_in_date, "desiredMoveInDate");
  const leaseDurationMonths = parsePositiveInt(b.leaseDurationMonths || b.lease_duration_months, "leaseDurationMonths");
  const numberOfOccupants = parsePositiveInt(b.numberOfOccupants || b.number_of_occupants, "numberOfOccupants");
  const messageToLandlord = String(b.messageToLandlord || b.message_to_landlord || "").trim();

  const files = req.files || [];
  const idPart = firstUploadedBuffer(files, [
    "nationalId",
    "national_id",
    "idDocument",
    "id_document",
    "iddocument",
    "passport",
    "file",
    "photo",
    "upload",
  ]);
  if (!idPart) {
    throw badRequest(
      "National ID or passport file is required. Use a multipart file field such as: nationalId, national_id, idDocument, id_document, or passport."
    );
  }

  const property = await Property.findById(propertyId).exec();
  if (!property) throw notFound("Property not found");

  const unit = getUnitOrThrow(property, unitId);
  if (!unit.availability) throw badRequest("This unit is not available for lease requests");

  await assertNoDuplicateOpenRequest(req.user.userId, property._id, unit._id);

  const idDocumentUrl = (
    await uploadBufferToCloudinary({
      buffer: idPart.buffer,
      filename: idPart.originalname || "id-document",
      folder: "pm-backend/lease-requests/id-documents",
    })
  ).secureUrl;

  const lr = await LeaseRequest.create({
    tenantId: req.user.userId,
    managerId: property.managerId,
    propertyId: property._id,
    unitId: unit._id,
    desiredMoveInDate,
    leaseDurationMonths,
    numberOfOccupants,
    messageToLandlord,
    idDocumentUrl,
    status: "pending_review",
  });

  await syncTenantLeaseAccountStatus(req.user.userId);

  res.status(201).json({
    leaseRequest: withDisplay(lr),
    notification: {
      message: "Your lease application was submitted. Status: Pending Approval.",
    },
  });
});

const listMyLeaseRequests = asyncHandler(async (req, res) => {
  const list = await LeaseRequest.find({ tenantId: req.user.userId }).sort({ createdAt: -1 }).limit(50).exec();
  res.json({ leaseRequests: list.map((x) => withDisplay(x)) });
});

const getLeaseRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) throw badRequest("Invalid id");

  const lr = await LeaseRequest.findById(id).exec();
  if (!lr) throw notFound("Lease request not found");

  const role = req.user.role;
  const uid = req.user.userId;
  if (role === "admin") {
    return res.json({ leaseRequest: withDisplay(lr) });
  }
  if (role === "tenant" && lr.tenantId.toString() !== uid) throw forbidden("Not allowed");
  if (role === "manager" && lr.managerId.toString() !== uid) throw forbidden("Not allowed");
  if (role === "visitor") throw forbidden("Not allowed");

  res.json({ leaseRequest: withDisplay(lr) });
});

const listManagerLeaseRequests = asyncHandler(async (req, res) => {
  const q = { managerId: req.user.userId };
  const propertyId = req.query.propertyId || req.query.property_id;
  if (propertyId) {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) throw badRequest("Invalid propertyId");
    q.propertyId = propertyId;
  }
  const status = req.query.status;
  if (status) q.status = status;

  const list = await LeaseRequest.find(q).sort({ createdAt: -1 }).limit(100).exec();
  res.json({ leaseRequests: list.map((x) => withDisplay(x)) });
});

const uploadAdditionalDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lr = await LeaseRequest.findById(id).exec();
  if (!lr) throw notFound("Lease request not found");
  if (lr.tenantId.toString() !== req.user.userId) throw forbidden("Not allowed");
  if (lr.status !== "additional_documents_requested") {
    throw badRequest("Additional documents can only be uploaded when the landlord has requested them");
  }

  const files = collectFieldFiles(req.files || [], ["additionalDocument", "additional_document"]);
  if (!files.length) throw badRequest("Upload at least one file (additionalDocument)");

  const ids = [];
  for (const f of files) {
    const { secureUrl } = await uploadBufferToCloudinary({
      buffer: f.buffer,
      filename: f.originalname || "additional-document",
      folder: "pm-backend/lease-requests/additional-docs",
    });
    ids.push(secureUrl);
  }

  lr.additionalDocumentUrls = [...(lr.additionalDocumentUrls || []), ...ids];
  lr.status = "under_review";
  await lr.save();
  await syncTenantLeaseAccountStatus(lr.tenantId);

  res.json({
    leaseRequest: withDisplay(lr),
    notification: { message: "Your documents were submitted. Status: Application Under Review." },
  });
});

const reviewLeaseRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const action = String(body.action || "").trim();

  const lr = await LeaseRequest.findById(id).exec();
  if (!lr) throw notFound("Lease request not found");
  if (lr.managerId.toString() !== req.user.userId) throw forbidden("Not allowed");

  if (["rejected", "completed_active_resident"].includes(lr.status)) {
    throw badRequest("This application is already closed");
  }

  let notificationMessage = "";

  if (action === "mark_under_review") {
    if (!PRE_PHYSICAL_OPEN.includes(lr.status)) {
      throw badRequest("Cannot mark under review from current status");
    }
    lr.status = "under_review";
    notificationMessage = "Your application is under review.";
  } else if (action === "reject") {
    const reason = String(body.rejectionReason || body.rejection_reason || "").trim();
    if (!reason) throw badRequest("rejectionReason is required");
    const wasAwaitingPhysical = lr.status === "approved_awaiting_physical";
    lr.status = "rejected";
    lr.rejectionReason = reason;
    if (wasAwaitingPhysical) {
      await setUnitAvailability(lr.propertyId, lr.unitId, true);
    }
    notificationMessage = "Your lease application was rejected.";
  } else if (action === "request_additional_documents") {
    const note = String(body.additionalDocumentsNote || body.additional_documents_note || "").trim();
    if (!note) throw badRequest("additionalDocumentsNote is required");
    lr.additionalDocumentsNote = note;
    lr.status = "additional_documents_requested";
    notificationMessage = "The landlord requested additional documents.";
  } else if (action === "schedule_meeting") {
    const scheduledMeetingAt = parseDate(
      body.scheduledMeetingAt || body.scheduled_meeting_at,
      "scheduledMeetingAt"
    );
    lr.scheduledMeetingAt = scheduledMeetingAt;
    lr.meetingLocation = String(body.meetingLocation || body.meeting_location || "").trim();
    lr.meetingNotes = String(body.meetingNotes || body.meeting_notes || "").trim();
    lr.status = "meeting_scheduled";
    notificationMessage = "An in-person meeting was scheduled for your application.";
  } else if (action === "approve_digital") {
    if (!PRE_PHYSICAL_OPEN.includes(lr.status)) {
      throw badRequest("Digital approval is only allowed from an active review stage");
    }
    const appointmentDate = parseDate(body.appointmentDate || body.appointment_date, "appointmentDate");
    const officeLocation = String(body.officeLocation || body.office_location || "").trim();
    const requiredDocumentsBring = String(
      body.requiredDocumentsBring || body.required_documents_bring || ""
    ).trim();
    if (!officeLocation) throw badRequest("officeLocation is required");
    if (!requiredDocumentsBring) throw badRequest("requiredDocumentsBring is required");

    const property = await Property.findById(lr.propertyId).exec();
    if (!property) throw notFound("Property not found");
    const unit = getUnitOrThrow(property, lr.unitId);
    if (!unit.availability) throw badRequest("This unit is no longer available");

    lr.appointmentDate = appointmentDate;
    lr.officeLocation = officeLocation;
    lr.requiredDocumentsBring = requiredDocumentsBring;
    lr.status = "approved_awaiting_physical";
    await lr.save();
    await setUnitAvailability(lr.propertyId, lr.unitId, false);

    await syncTenantLeaseAccountStatus(lr.tenantId);

    return res.json({
      leaseRequest: withDisplay(lr),
      notification: {
        message:
          "Your application was approved. Please attend your appointment for physical verification and signing.",
        appointmentDate: lr.appointmentDate,
        officeLocation: lr.officeLocation,
        requiredDocumentsBring: lr.requiredDocumentsBring,
      },
    });
  } else {
    throw badRequest(
      "Invalid action. Use: mark_under_review, reject, request_additional_documents, schedule_meeting, approve_digital"
    );
  }

  await lr.save();
  await syncTenantLeaseAccountStatus(lr.tenantId);

  res.json({
    leaseRequest: withDisplay(lr),
    notification: notificationMessage ? { message: notificationMessage } : undefined,
  });
});

const completePhysicalLease = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const lr = await LeaseRequest.findById(id).exec();
  if (!lr) throw notFound("Lease request not found");
  if (lr.managerId.toString() !== req.user.userId) throw forbidden("Not allowed");
  if (lr.status !== "approved_awaiting_physical") {
    throw badRequest("Physical completion is only allowed after digital approval");
  }

  const b = req.body || {};
  lr.physicalCompletionNotes = String(b.physicalCompletionNotes || b.physical_completion_notes || "").trim();
  lr.physicalCompletedAt = new Date();

  const tenant = await User.findById(lr.tenantId).select("email fullName").exec();
  if (!tenant) throw notFound("Tenant not found");

  const files = req.files || [];
  const digitalPart = firstUploadedBuffer(files, ["digitalCopy", "digital_copy"]);
  if (digitalPart) {
    lr.digitalCopyUrl = (
      await uploadBufferToCloudinary({
        buffer: digitalPart.buffer,
        filename: digitalPart.originalname || "lease-digital-copy",
        folder: "pm-backend/lease-requests/lease-copies",
      })
    ).secureUrl;
  }

  const photoParts = collectFieldFiles(files, ["signedContractPhoto", "signed_contract_photo"]);
  const photoUrls = [];
  for (const f of photoParts) {
    photoUrls.push(
      (
        await uploadBufferToCloudinary({
          buffer: f.buffer,
          filename: f.originalname || "signed-contract",
          folder: "pm-backend/lease-requests/signed-contracts",
        })
      ).secureUrl
    );
  }
  if (photoUrls.length) {
    lr.signedContractPhotoUrls = [...(lr.signedContractPhotoUrls || []), ...photoUrls];
  }

  const tenantSignName = String(b.tenantSignatoryName || b.tenant_signatory_name || tenant.fullName || "Tenant").trim();
  const managerSignName = String(
    b.managerSignatoryName || b.manager_signatory_name || req.user.fullName || "Manager"
  ).trim();
  const now = new Date();

  const lease = await LeaseAgreement.create({
    tenantId: lr.tenantId,
    managerId: lr.managerId,
    propertyId: lr.propertyId,
    unitId: lr.unitId,
    tenantEmail: tenant.email || "tenant@unknown",
    agreementHtml:
      "<p>Lease finalized in person at the property office. Digital template signatures recorded at completion.</p>",
    status: "approved",
    approvedAt: now,
    tenantSignature: { fullName: tenantSignName, signedAt: now },
    managerSignature: { fullName: managerSignName, signedAt: now },
  });

  lr.leaseAgreementId = lease._id;
  lr.status = "completed_active_resident";
  await lr.save();

  await syncTenantLeaseAccountStatus(lr.tenantId);

  res.json({
    leaseRequest: withDisplay(lr),
    lease: { id: lease._id.toString(), status: lease.status },
    notification: {
      message:
        "Lease finalized in person. You are now an active resident. Keys and access should be granted as agreed on site.",
    },
  });
});

module.exports = {
  createLeaseRequest,
  listMyLeaseRequests,
  getLeaseRequestById,
  listManagerLeaseRequests,
  uploadAdditionalDocuments,
  reviewLeaseRequest,
  completePhysicalLease,
};