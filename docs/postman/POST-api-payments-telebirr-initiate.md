# POST /api/payments/telebirr/initiate

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/payments/telebirr/initiate
- Auth: Bearer active tenant token
- Content-Type: application/json

## Body
```
{"leaseId":"<leaseId>","paymentType":"rent","amount":5000}
```

## Expected Result
- Creates pending transaction and returns referenceId.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
