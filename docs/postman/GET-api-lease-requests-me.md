# GET /api/lease-requests/me

**Flow step 2 — See my applications (tenant).** Also **flow step 7** after digital approval: same response shows appointment fields (no extra endpoint).

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/lease-requests/me
- Auth: Bearer tenant token
- Content-Type: None

## Values you must fill

| Where | Value |
|-------|--------|
| URL | No path parameters. Use URL as shown. |
| Headers | `Authorization: Bearer <tenant JWT>` |
| Body | None. |

## After digital approval (step 7) — read from response

Each element in `leaseRequests[]` may include (when manager used `approve_digital`):

| Field | Meaning |
|-------|---------|
| `status` | e.g. `approved_awaiting_physical` |
| `statusDisplay` | Human-readable status |
| `appointmentDate` | When to attend |
| `officeLocation` | Where to go |
| `requiredDocumentsBring` | What to bring |

## Body
```
None
```

## Expected Result
- List lease applications for the logged-in tenant.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
