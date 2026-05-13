const mongoose = require("mongoose");

const leaseAgreementSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true },

    tenantEmail: { type: String, trim: true, required: true },

    agreementHtml: { type: String }, // generated lease content
    status: {
      type: String,
      enum: ["generated", "tenant_signed", "manager_signed", "approved"],
      default: "generated",
      index: true,
    },

    tenantSignature: {
      fullName: { type: String },
      signedAt: { type: Date },
    },
    managerSignature: {
      fullName: { type: String },
      signedAt: { type: Date },
    },
    approvedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("LeaseAgreement", leaseAgreementSchema);

