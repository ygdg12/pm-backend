const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    unitId: { type: mongoose.Schema.Types.ObjectId },

    tenant_name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    // Optional attachment stored in GridFS
    photoFileId: { type: mongoose.Schema.Types.ObjectId, default: null },

    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open", index: true },
    // Friendly identifier (matches doc requirement: request_id)
    request_id: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Complaint", complaintSchema);

