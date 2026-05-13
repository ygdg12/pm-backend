# GET /api/lease-requests/manager/inbox

**Flow step 4 — Manager queue.**

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/lease-requests/manager/inbox
- Auth: Bearer manager token
- Content-Type: None

## Values you must fill

| Where | Value |
|-------|--------|
| URL | No path parameters required. |
| Headers | `Authorization: Bearer <manager JWT>` |
| Body | None. |
| Query | **Optional** — see table below. Omit both to list all requests for this manager. |

## Query (optional)

| Query key | Example | Notes |
|-----------|---------|--------|
| `propertyId` or `property_id` | Mongo `_id` | Filter to one property |
| `status` | See list below | Filter by request `status` |

**Valid `status` values** (if you use the query): `pending_review`, `under_review`, `additional_documents_requested`, `meeting_scheduled`, `rejected`, `approved_awaiting_physical`, `completed_active_resident`.

## Body
```
None
```

## Expected Result
- List lease request applications for this manager’s properties.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
