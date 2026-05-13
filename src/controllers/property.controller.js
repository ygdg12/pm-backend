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

/** Multipart text fields: accept units, Units, property_units, etc. */
function pickUnitsFromBody(body) {
  if (!body || typeof body !== "object") return undefined;
  const preferred = ["units", "propertyUnits", "property_units", "unitList", "unitsJson", "units_json"];
  for (const key of preferred) {
    const v = body[key];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  for (const [k, v] of Object.entries(body)) {
    if (k.toLowerCase() === "units" && v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

/** Turn multipart / JSON value into an array for Zod, or undefined if missing. */
function coerceUnitsPayload(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return undefined;
    try {
      return JSON.parse(t);
    } catch {
      return undefined;
    }
  }
  if (typeof raw === "object") return raw;
  return undefined;
}

function parseUnitsFromRequest(body) {
  const picked = pickUnitsFromBody(body);
  let data = coerceUnitsPayload(picked);
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.unit_label != null || data.square_meters != null || data.lease_price != null) {
      data = [data];
    }
  }
  return data;
}

function normalizePropertyUploadFiles(req) {
  const f = req.files;
  if (!f) return [];
  if (Array.isArray(f)) return f.slice(0, 10);
  if (f.images) {
    const imgs = Array.isArray(f.images) ? f.images : [f.images];
    return imgs.slice(0, 10);
  }
  return [];
}

const createProperty = asyncHandler(async (req, res) => {
  const unitsData = parseUnitsFromRequest(req.body);
  if (unitsData === undefined) {
    throw badRequest(
      "Missing `units`. Add a **Text** field in multipart named `units` (or `property_units`) whose value is a **JSON array** string, e.g. " +
        '[{"unit_label":"A1","square_meters":120,"lease_price":15000}]. ' +
        "Each unit needs unit_label, square_meters (>0), and lease_price (>0)."
    );
  }

  const unitsParsed = unitsArraySchema.safeParse(unitsData);
  if (!unitsParsed.success) {
    throw badRequest(
      "Invalid units payload. Expected a JSON array of objects with unit_label, square_meters, lease_price (all positive). " +
        "Example: [{\"unit_label\":\"A1\",\"square_meters\":120,\"lease_price\":15000}]",
      unitsParsed.error.flatten()
    );
  }

  const images = [];
  const uploadedImages = normalizePropertyUploadFiles(req);
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
  const unitsData = parseUnitsFromRequest(req.body);

  const hasAnyField =
    name_of_compound !== undefined ||
    owner_name !== undefined ||
    street_address !== undefined ||
    unitsData !== undefined ||
    (Array.isArray(req.files) && req.files.length > 0);

  if (!hasAnyField) {
    throw badRequest("No update fields provided");
  }

  if (name_of_compound !== undefined) property.name_of_compound = String(name_of_compound).trim();
  if (owner_name !== undefined) property.owner_name = String(owner_name).trim();
  if (street_address !== undefined) property.street_address = String(street_address).trim();

  if (unitsData !== undefined) {
    const unitsParsed = unitsArraySchema.safeParse(unitsData);
    if (!unitsParsed.success) throw badRequest("Invalid units payload", unitsParsed.error.flatten());
    property.units = unitsParsed.data;
  }

  // If images were sent, replace existing images
  const uploadedImages = normalizePropertyUploadFiles(req);
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

