# GET /api/admin/managers/pending

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/admin/managers/pending
- Auth: Bearer admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- List pending manager registrations.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
