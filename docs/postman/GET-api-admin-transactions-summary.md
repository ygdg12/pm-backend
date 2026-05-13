# GET /api/admin/transactions/summary

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/admin/transactions/summary
- Auth: Bearer admin token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Transaction summary grouped by property.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
