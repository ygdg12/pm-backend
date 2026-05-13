# GET /api/properties/:id

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/properties/{id}
- Auth: Bearer tenant/visitor/manager/admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Get one property by id.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
