const mongoose = require("mongoose");

const unitSchema = new mongoose.Schema(
  {
    unit_label: { type: String, trim: true, required: true },
    square_meters: { type: Number, required: true },
    lease_price: { type: Number, required: true },
    availability: { type: Boolean, default: true },
  },
  { _id: true }
);

const propertySchema = new mongoose.Schema(
  {
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name_of_compound: { type: String, trim: true, required: true },
    owner_name: { type: String, trim: true },
    street_address: { type: String, trim: true, required: true },

    units: { type: [unitSchema], default: [] },

    images: { type: [mongoose.Schema.Types.ObjectId], default: [] }, // stored in GridFS
  },
  { timestamps: true }
);

propertySchema.index({ name_of_compound: "text", street_address: "text" });

module.exports = mongoose.model("Property", propertySchema);

