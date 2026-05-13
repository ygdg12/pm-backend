# GET /api/payments/me

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/payments/me
- Auth: Bearer active tenant token
- Content-Type: None

## Body
```
None
```

## Expected Result
- List current tenant transactions.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
