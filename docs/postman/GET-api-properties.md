# GET /api/properties

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/properties
- Auth: Bearer **tenant**, **visitor**, or **manager** token
- Content-Type: None

## Body
```
Query params optional: q, location, minPrice, maxPrice, minSize, availability
```

## Response shape
```json
{ "properties": [ { "_id": "...", "name_of_compound": "...", "owner_name": "...", "street_address": "...", "units": [], "images": [] } ] }
```

- **`properties`**: array of property documents.
- **`units`**: each item has `unit_label`, `square_meters`, `lease_price` (must be greater than 0), `availability`.
- **`images`**: array of **string URLs** (Cloudinary), not GridFS ids.

## Role behavior
- **Tenant / visitor**: all listings (subject to query filters), up to 50 results.
- **Manager**: only properties where **`managerId`** is the logged-in manager (same idea as [GET /api/properties/mine](./GET-api-properties-mine.md), but this endpoint supports search filters). Limit 50.

## Expected Result
- Success: **200** with `{ "properties": [...] }`.
- Auth: **401** if missing/invalid token; **403** if role not allowed.
