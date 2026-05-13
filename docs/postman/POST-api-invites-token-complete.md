# POST /api/invites/:token/complete

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/invites/{token}/complete
- Auth: No
- Content-Type: application/json

## Body
```
{"fullName":"Tenant User","kebeleId":"KB-001","phoneNumber":"0911000001","password":"secret123"}
```

## Expected Result
- Registers tenant from invite, creates lease draft, returns tenant token.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
