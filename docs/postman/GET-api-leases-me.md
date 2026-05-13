# GET /api/leases/me

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/leases/me
- Auth: Bearer tenant or manager token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Get leases for current tenant/manager.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
