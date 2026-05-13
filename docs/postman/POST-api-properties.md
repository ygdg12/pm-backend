# POST /api/properties

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/properties
- Auth: Bearer manager token
- Content-Type: multipart/form-data

## Option A — Human labels (Insomnia-friendly)

Use **Text** fields with these labels (spaces OK). **No JSON `units` required** if you send square meters + lease price as separate numbers.

| Label (example) | Maps to |
|------------------|---------|
| Name of the compound / name_of_compound | compound name |
| Name of the property owner / owner_name | owner |
| Street address / street_address | address |
| Square meter / square meters / square_meters | size (m²) |
| Lease price / lease_price / rent | monthly rent |
| Images / images / file | at least one **image** file |

Optional: **Unit label** — if omitted, the server uses `Unit 1`.

## Option B — API field names + JSON `units`

| Field | Type |
|-------|------|
| `name_of_compound`, `owner_name`, `street_address` | Text |
| `units` | Text: JSON array string `[{"unit_label":"A1","square_meters":150,"lease_price":25000}]` |
| Any image field name(s) | File(s), `image/*`, max 10 |

## Required result

- Compound name, owner name, street address (non-empty)
- At least one unit with positive **square_meters** and **lease_price** (from flat fields or JSON)
- At least one image

## Expected Result
- **201** when valid.
- **400** with details if something is missing or invalid.
