const mongoose = require("mongoose");

const TRANSACTION_STATUSES = ["pending", "pending_review", "success", "failed"];

const transactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    leaseId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaseAgreement", required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    paymentType: { type: String, enum: ["rent", "deposit"], required: true },

    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: "pending",
      index: true,
    },

    /** Receipt / screenshot uploaded by tenant (GridFS uploads bucket). */
    proofFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    proofSubmittedAt: { type: Date, default: null },
    tenantProofNote: { type: String, trim: true, default: "" },

    /** When manager confirms a proof-based payment. */
    confirmedAt: { type: Date, default: null },
    managerReviewNote: { type: String, trim: true, default: "" },

    telebirr: {
      referenceId: { type: String, index: true },
      rawStatus: { type: String },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ "telebirr.referenceId": 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
module.exports.TRANSACTION_STATUSES = TRANSACTION_STATUSES;

