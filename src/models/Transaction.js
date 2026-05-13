const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    leaseId: { type: mongoose.Schema.Types.ObjectId, ref: "LeaseAgreement", required: true, index: true },
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },

    amount: { type: Number, required: true, min: 0 },
    paymentType: { type: String, enum: ["rent", "deposit"], required: true },

    status: { type: String, enum: ["pending", "success", "failed"], default: "pending", index: true },

    telebirr: {
      referenceId: { type: String, index: true },
      rawStatus: { type: String },
    },
  },
  { timestamps: true }
);

transactionSchema.index({ "telebirr.referenceId": 1 });

module.exports = mongoose.model("Transaction", transactionSchema);

