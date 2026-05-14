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
      // Managers: pending | active | rejected
      // Tenants: active | pending_lease_request | approved_awaiting_physical | active_resident
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

    // Manager specific (proof documents on Cloudinary — secure URLs)
    telebirrMerchantAccountProofUrl: { type: String, default: null },
    propertyOwnershipProofUrl: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

