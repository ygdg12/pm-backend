# POST /api/leases/:id/sign/manager

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/leases/{id}/sign/manager
- Auth: Bearer manager token
- Content-Type: application/json

## Body
```
{"fullName":"Manager User"}
```

## Expected Result
- Manager signs and approves lease, activates tenant.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
