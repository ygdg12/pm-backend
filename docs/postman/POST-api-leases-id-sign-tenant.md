# POST /api/leases/:id/sign/tenant

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/leases/{id}/sign/tenant
- Auth: Bearer tenant token
- Content-Type: application/json

## Body
```
{"fullName":"Tenant User"}
```

## Expected Result
- Tenant signs lease.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
