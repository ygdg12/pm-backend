const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["admin", "manager", "tenant", "visitor"],
      required: true,
      index: true,
    },
    accountStatus: {
      // For managers: pending/active/rejected
      // For tenants: pending_approval/active/rejected
      type: String,
      default: "active",
    },

    fullName: { type: String, trim: true },
    email: { type: String, trim: true, unique: true, index: true, sparse: true },
    phoneNumber: { type: String, trim: true },

    // Tenant specific
    kebeleId: { type: String, trim: true },

    // Auth
    passwordHash: { type: String },

    // Manager specific (proofs are stored in GridFS)
    telebirrMerchantAccountProofFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    propertyOwnershipProofFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

