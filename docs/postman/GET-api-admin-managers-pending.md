# GET /api/admin/managers/pending

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/admin/managers/pending
- Auth: **Bearer Token** — use the `token` returned from `POST /api/auth/login` with your **admin** email/password (not a JSON body on this GET).

## Common mistakes
- **Wrong:** `GET /api/auth/admin/manager/pending` — there is no `/api/auth/admin` in this API.
- **Wrong:** `manager` (singular) — the path is **`managers`** (plural).
- **Wrong:** Putting `email` / `password` in the **GET** body — use **Auth → Bearer Token** in Insomnia/Postman instead.

## Body
```
None
```

## Expected Result
- List pending manager registrations.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
