# GET /api/leases/:id

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/leases/{id}
- Auth: Bearer tenant/manager/admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Get lease details by id.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
