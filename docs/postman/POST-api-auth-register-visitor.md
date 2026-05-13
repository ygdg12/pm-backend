# POST /api/auth/register/visitor

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/auth/register/visitor
- Auth: No
- Content-Type: application/json

## Body
```
{"fullName":"Visitor User","email":"visitor@example.com","phoneNumber":"0911000000","password":"secret123"}
```

## Expected Result
- Creates visitor account and returns token.
- Email is stored **lowercase**; login accepts any casing (e.g. register `User@Mail.com`, login `user@mail.com`).
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
