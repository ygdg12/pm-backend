const { asyncHandler } = require("../utils/asyncHandler");
const { badRequest, notFound } = require("../utils/httpError");
const Property = require("../models/Property");
const { uploadBufferToGridFS } = require("../services/gridfs.service");
const { z } = require("zod");

const unitSchema = z.object({
  unit_label: z.string().min(1),
  square_meters: z.coerce.number().positive(),
  lease_price: z.coerce.number().positive(),
  availability: z.coerce.boolean().optional().default(true),
});

const unitsArraySchema = z.array(unitSchema).min(1, "At least one unit is required with square_meters and lease_price");

function assertCompletePropertyListing(data) {
  const name = String(data.name_of_compound ?? "").trim();
  const owner = String(data.owner_name ?? "").trim();
  const street = String(data.street_address ?? "").trim();
  const missing = [];
  if (!name) missing.push("name_of_compound (name of compound)");
  if (!owner) missing.push("owner_name (name of property owner)");
  if (!street) missing.push("street_address");
  const units = data.units;
  if (!Array.isArray(units) || units.length === 0) {
    missing.push("at least one unit (each needs unit_label, square_meters, lease_price)");
  } else {
    units.forEach((u, i) => {
      const label = String(u.unit_label ?? "").trim();
      const sq = Number(u.square_meters);
      const price = Number(u.lease_price);
      if (!label) missing.push(`unit[${i}].unit_label`);
      if (!(sq > 0)) missing.push(`unit[${i}].square_meters (must be a positive number)`);
      if (!(price > 0)) missing.push(`unit[${i}].lease_price (must be a positive number)`);
    });
  }
  const images = data.images;
  if (!Array.isArray(images) || images.length === 0) {
    missing.push("at least one image file");
  }
  if (missing.length) {
    throw badRequest(
      `Listing incomplete. All of the following are required: street address, name of compound, name of property owner, square meters and lease price per unit, and images. Missing or invalid: ${missing.join(
        ", "
      )}`
    );
  }
}

function parseMaybeJson(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const createProperty = asyncHandler(async (req, res) => {
  const unitsRaw = parseMaybeJson(req.body?.units);

  const unitsParsed = unitsArraySchema.safeParse(unitsRaw);
  if (!unitsParsed.success) {
    throw badRequest("Invalid units payload", unitsParsed.error.flatten());
  }

  const images = [];
  const uploadedImages = req.files || [];
  for (const file of uploadedImages) {
    const fileId = await uploadBufferToGridFS({
      buffer: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
    });
    images.push(fileId);
  }

  const name_of_compound = String(req.body?.name_of_compound ?? "").trim();
  const owner_name = String(req.body?.owner_name ?? "").trim();
  const street_address = String(req.body?.street_address ?? "").trim();

  const draft = {
    name_of_compound,
    owner_name,
    street_address,
    units: unitsParsed.data,
    images,
  };
  assertCompletePropertyListing(draft);

  const property = await Property.create({
    managerId: req.user.userId,
    name_of_compound,
    owner_name,
    street_address,
    units: unitsParsed.data,
    images,
  });

  res.status(201).json({ property });
});

const updateProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const property = await Property.findById(id).exec();
  if (!property) throw notFound("Property not found");

  if (property.managerId.toString() !== req.user.userId) {
    throw badRequest("You can only update your own properties");
  }

  const { name_of_compound, owner_name, street_address } = req.body || {};
  const unitsRaw = parseMaybeJson(req.body?.units);

  const hasAnyField =
    name_of_compound !== undefined ||
    owner_name !== undefined ||
    street_address !== undefined ||
    unitsRaw !== undefined ||
    (req.files && req.files.length > 0);

  if (!hasAnyField) {
    throw badRequest("No update fields provided");
  }

  if (name_of_compound !== undefined) property.name_of_compound = String(name_of_compound).trim();
  if (owner_name !== undefined) property.owner_name = String(owner_name).trim();
  if (street_address !== undefined) property.street_address = String(street_address).trim();

  if (unitsRaw !== undefined) {
    const unitsParsed = unitsArraySchema.safeParse(unitsRaw);
    if (!unitsParsed.success) throw badRequest("Invalid units payload", unitsParsed.error.flatten());
    property.units = unitsParsed.data;
  }

  // If images were sent, replace existing images
  const uploadedImages = req.files || [];
  if (uploadedImages.length > 0) {
    const images = [];
    for (const file of uploadedImages) {
      const fileId = await uploadBufferToGridFS({
        buffer: file.buffer,
        filename: file.originalname,
        contentType: file.mimetype,
      });
      images.push(fileId);
    }
    property.images = images;
  }

  assertCompletePropertyListing({
    name_of_compound: property.name_of_compound,
    owner_name: property.owner_name,
    street_address: property.street_address,
    units: property.units,
    images: property.images,
  });

  await property.save();
  res.json({ property });
});

const deleteProperty = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await Property.findById(id).exec();
  if (!property) throw notFound("Property not found");

  if (property.managerId.toString() !== req.user.userId) {
    throw badRequest("You can only delete your own properties");
  }

  await property.deleteOne();
  res.json({ ok: true });
});

const listProperties = asyncHandler(async (req, res) => {
  const { q, location, minPrice, maxPrice, minSize, availability } = req.query || {};

  const filter = {};
  const unitMatch = {};

  if (q) {
    const rx = new RegExp(String(q), "i");
    filter.$or = [{ name_of_compound: rx }, { street_address: rx }];
  }

  if (location) {
    filter.street_address = new RegExp(String(location), "i");
  }

  if (availability !== undefined) {
    const availBool = String(availability).toLowerCase() === "true";
    unitMatch.availability = availBool;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    unitMatch.lease_price = {};
    if (minPrice !== undefined) unitMatch.lease_price.$gte = Number(minPrice);
    if (maxPrice !== undefined) unitMatch.lease_price.$lte = Number(maxPrice);
  }

  if (minSize !== undefined) {
    unitMatch.square_meters = { $gte: Number(minSize) };
  }

  if (Object.keys(unitMatch).length > 0) {
    filter.units = { $elemMatch: unitMatch };
  }

  const properties = await Property.find(filter).sort({ createdAt: -1 }).limit(50).exec();

  // Optionally return only matching units for readability on the client.
  const normalized = properties.map((p) => {
    const units = unitMatch.availability !== undefined || unitMatch.lease_price || unitMatch.square_meters
      ? p.units.filter((u) => {
          if (unitMatch.availability !== undefined && u.availability !== unitMatch.availability) return false;
          if (unitMatch.lease_price) {
            const lp = u.lease_price;
            if (unitMatch.lease_price.$gte !== undefined && lp < unitMatch.lease_price.$gte) return false;
            if (unitMatch.lease_price.$lte !== undefined && lp > unitMatch.lease_price.$lte) return false;
          }
          if (unitMatch.square_meters) {
            const sz = u.square_meters;
            if (unitMatch.square_meters.$gte !== undefined && sz < unitMatch.square_meters.$gte) return false;
          }
          return true;
        })
      : p.units;

    return { ...p.toObject(), units };
  });

  res.json({ properties: normalized });
});

const getPropertyById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const property = await Property.findById(id).exec();
  if (!property) throw notFound("Property not found");
  res.json({ property });
});

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  listProperties,
  getPropertyById,
};

