# PATCH /api/admin/managers/:id/approve

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/admin/managers/{id}/approve
- Auth: Bearer admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Approve pending manager.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
