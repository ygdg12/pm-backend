# POST /api/lease-requests

**Flow step 1 — Request lease (tenant).** Multipart: move-in, duration, occupants, ID file, message.

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/lease-requests
- Auth: Bearer tenant token
- Content-Type: multipart/form-data

## Values you must fill (required)

| Field name (pick one spelling) | Value |
|--------------------------------|--------|
| `propertyId` **or** `property_id` | Property Mongo `_id` (from listings). |
| `unitId` **or** `unit_id` | Unit subdocument `_id` inside that property. |
| `desiredMoveInDate` **or** `desired_move_in_date` | ISO date string, e.g. `2026-06-01`. |
| `leaseDurationMonths` **or** `lease_duration_months` | Positive integer as text, e.g. `12`. |
| `numberOfOccupants` **or** `number_of_occupants` | Positive integer as text, e.g. `2`. |
| **File** — one of: `nationalId`, `national_id`, `idDocument`, `id_document`, `passport`, or generic `file` / `photo` / `upload` (single file) | One image or PDF (national ID or passport). Field name matching is **case-insensitive**. |

## If you get “National ID or passport file is required”

- Redeploy the API so you have the latest upload handler, **or** rename the file field to **`idDocument`** or **`nationalId`** exactly.
- Ensure the part is type **File** (not a text field with a path string).

## Optional

| Field name | Value |
|------------|--------|
| `messageToLandlord` **or** `message_to_landlord` | Any text message to the landlord. |

## Expected Result
- Submit a new lease application for a unit.
- Success status: 201 when valid.
- On validation/auth errors: 400, 401, 403, 404.
