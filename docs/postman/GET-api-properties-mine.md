# GET /api/properties/mine

**Property manager only** — list all properties created by the authenticated manager.

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/properties/mine
- Auth: Bearer **manager** token (account must be **active**)
- Content-Type: None

## Body
None.

## Response shape
Same as catalog list:

```json
{
  "properties": [ { "_id": "...", "managerId": "...", "name_of_compound": "...", "units": [], "images": [], ... } ]
}
```

- `properties` is an **array** (not `items` / `data`).
- `images` are **HTTPS URLs** (Cloudinary) when uploaded via the API.

## Notes
- This route is registered **before** `GET /api/properties/:id` so the path segment `mine` is never treated as an ObjectId (which previously caused **500** errors).
- Managers can also use **GET /api/properties** with the same Bearer token: the server applies **`managerId`** filter so only their listings are returned (plus optional query filters `q`, `location`, etc.).
