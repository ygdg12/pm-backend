const mongoose = require("mongoose");

const tenantInviteSchema = new mongoose.Schema(
  {
    token: { type: String, unique: true, index: true, required: true },
    tenantEmail: { type: String, trim: true, required: true, index: true },

    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, required: true }, // references Property.units._id

    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    usedByTenantId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

tenantInviteSchema.index({ tenantEmail: 1, propertyId: 1, unitId: 1 });

module.exports = mongoose.model("TenantInvite", tenantInviteSchema);

