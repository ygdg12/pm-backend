# POST /api/payments/telebirr/webhook

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/payments/telebirr/webhook
- Auth: No (signature protected)
- Content-Type: raw JSON

## Body
```
{"referenceId":"<reference>","status":"SUCCESS","amount":5000}
```

## Expected Result
- Telebirr callback endpoint. Include x-telebirr-signature when secret is set.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
