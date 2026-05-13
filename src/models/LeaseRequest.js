const mongoose = require("mongoose");

/** Application lifecycle before / through physical lease signing */
const LEASE_REQUEST_STATUSES = [
  "pending_review",
  "under_review",
  "additional_documents_requested",
  "meeting_scheduled",
  "rejected",
  "approved_awaiting_physical",
  "completed_active_resident",
];

const leaseRequestSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true },

    desiredMoveInDate: { type: Date, required: true },
    leaseDurationMonths: { type: Number, required: true, min: 1 },
    numberOfOccupants: { type: Number, required: true, min: 1 },
    messageToLandlord: { type: String, trim: true, default: "" },

    /** National ID / passport (GridFS) */
    idDocumentFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    additionalDocumentFileIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    status: {
      type: String,
      enum: LEASE_REQUEST_STATUSES,
      default: "pending_review",
      index: true,
    },

    rejectionReason: { type: String, trim: true, default: "" },
    additionalDocumentsNote: { type: String, trim: true, default: "" },

    scheduledMeetingAt: { type: Date, default: null },
    meetingLocation: { type: String, trim: true, default: "" },
    meetingNotes: { type: String, trim: true, default: "" },

    /** Shown to tenant after digital approval */
    appointmentDate: { type: Date, default: null },
    officeLocation: { type: String, trim: true, default: "" },
    requiredDocumentsBring: { type: String, trim: true, default: "" },

    /** After in-person completion */
    leaseAgreementId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaseAgreement", default: null },
    digitalCopyFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    signedContractPhotoFileIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },

    physicalCompletedAt: { type: Date, default: null },
    physicalCompletionNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

leaseRequestSchema.index({ propertyId: 1, status: 1 });
leaseRequestSchema.index({ managerId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("LeaseRequest", leaseRequestSchema);
module.exports.LEASE_REQUEST_STATUSES = LEASE_REQUEST_STATUSES;
