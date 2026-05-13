# GET /api/lease-requests/:id

**Flow step 3 — See one application (tenant / manager / admin).** Also **flow step 7** after digital approval: same payload shows appointment fields.

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/lease-requests/{id}
- Auth: Bearer tenant, manager (own requests), or admin token
- Content-Type: None

## Values you must fill

| Where | Value |
|-------|--------|
| Path `{id}` | Lease request Mongo `_id` (copy from `GET /api/lease-requests/me` or manager inbox). |
| Headers | `Authorization: Bearer <tenant \| manager \| admin JWT>` |
| Body | None. |

## Path
- `{id}` — Lease request Mongo `_id` (from `GET /api/lease-requests/me` or manager inbox).

## After digital approval (step 7) — read from `leaseRequest`

| Field | Meaning |
|-------|---------|
| `appointmentDate` | When to attend |
| `officeLocation` | Where to go |
| `requiredDocumentsBring` | What to bring |
| `status` / `statusDisplay` | Current state |

## Body
```
None
```

## Expected Result
- Get one lease request by id.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
