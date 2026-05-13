# PATCH /api/admin/managers/:id/reject

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/admin/managers/{id}/reject
- Auth: Bearer admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Reject manager registration.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
