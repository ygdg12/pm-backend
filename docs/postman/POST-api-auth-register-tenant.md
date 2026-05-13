# POST /api/auth/register/tenant

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/auth/register/tenant
- Auth: No
- Content-Type: application/json

## Body
```
{"fullName":"Tenant User","email":"tenant@example.com","phoneNumber":"0911000000","password":"secret123","kebeleId":"KB-12345"}
```

## Expected Result
- Creates tenant account (active immediately), same pattern as visitor register, plus required **kebeleId**.
- Returns JWT token and user object.
- Email is stored lowercase; login accepts any casing.
- Success status: 201.
- On validation/auth errors: 400, 401, 403, 404.
