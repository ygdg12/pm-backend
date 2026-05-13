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

/** Normalize multipart field names for fuzzy matching (Insomnia human labels). */
function normField(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Find first body value whose key matches any alias (human-readable or API). */
function valueForFieldAliases(body, aliases) {
  if (!body || typeof body !== "object") return undefined;
  const want = aliases.map((a) => normField(a));
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null) continue;
    const nk = normField(k);
    const compact = nk.replace(/ /g, "");
    for (const w of want) {
      if (nk === w || compact === w.replace(/ /g, "")) {
        return v;
      }
    }
  }
  return undefined;
}

function parsePositiveNumber(value) {
  if (value === undefined || value === null) return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** One unit from flat "Square meter" + "Lease price" style forms (no JSON `units`). */
function buildSingleUnitFromFlatBody(body) {
  const sq = parsePositiveNumber(
    valueForFieldAliases(body, [
      "square_meters",
      "square meter",
      "square meters",
      "sqm",
      "size",
      "area",
    ])
  );
  const price = parsePositiveNumber(
    valueForFieldAliases(body, [
      "lease_price",
      "lease price",
      "rent",
      "price",
      "monthly rent",
      "rent amount",
    ])
  );
  if (sq === null || price === null) return undefined;
  const labelRaw = valueForFieldAliases(body, ["unit_label", "unit label", "unit", "apartment", "listing unit"]);
  const unit_label =
    labelRaw != null && String(labelRaw).trim() ? String(labelRaw).trim() : "Unit 1";
  return [{ unit_label, square_meters: sq, lease_price: price, availability: true }];
}

function pickCompoundFields(body) {
  const name = valueForFieldAliases(body, [
    "name_of_compound",
    "name of compound",
    "name of the compound",
    "compound name",
    "compound",
  ]);
  const owner = valueForFieldAliases(body, [
    "owner_name",
    "name of property owner",
    "name of the property owner",
    "property owner",
    "owner",
  ]);
  const street = valueForFieldAliases(body, ["street_address", "street address", "address", "location"]);
  return {
    name_of_compound: String(name ?? body?.name_of_compound ?? "").trim(),
    owner_name: String(owner ?? body?.owner_name ?? "").trim(),
    street_address: String(street ?? body?.street_address ?? "").trim(),
  };
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
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed;
      return undefined;
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
  if (Array.isArray(data) && data.length > 0) return data;
  return undefined;
}

/** JSON `units` array, OR flat Square meter + Lease price fields (Insomnia-friendly). */
function resolveUnitsArray(body) {
  const fromJson = parseUnitsFromRequest(body);
  if (Array.isArray(fromJson) && fromJson.length > 0) return fromJson;
  return buildSingleUnitFromFlatBody(body);
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
  const unitsData = resolveUnitsArray(req.body);
  if (unitsData === undefined || !Array.isArray(unitsData) || unitsData.length === 0) {
    throw badRequest(
      "Missing unit pricing. Either (1) add a Text field `units` with a JSON array: " +
        '[{"unit_label":"A1","square_meters":150,"lease_price":25000}], or (2) add Text fields for square meters and lease price ' +
        '(e.g. \"Square meter\" + \"Lease price\") with positive numbers."
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

  const { name_of_compound, owner_name, street_address } = pickCompoundFields(req.body);

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
  const loose = pickCompoundFields(req.body);
  const unitsData = resolveUnitsArray(req.body);

  const hasAnyField =
    name_of_compound !== undefined ||
    owner_name !== undefined ||
    street_address !== undefined ||
    !!loose.name_of_compound ||
    !!loose.owner_name ||
    !!loose.street_address ||
    unitsData !== undefined ||
    (Array.isArray(req.files) && req.files.length > 0);

  if (!hasAnyField) {
    throw badRequest("No update fields provided");
  }

  if (name_of_compound !== undefined) property.name_of_compound = String(name_of_compound).trim();
  else if (loose.name_of_compound) property.name_of_compound = loose.name_of_compound;
  if (owner_name !== undefined) property.owner_name = String(owner_name).trim();
  else if (loose.owner_name) property.owner_name = loose.owner_name;
  if (street_address !== undefined) property.street_address = String(street_address).trim();
  else if (loose.street_address) property.street_address = loose.street_address;

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

