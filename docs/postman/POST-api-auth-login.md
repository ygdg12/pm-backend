# POST /api/auth/login

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/auth/login
- Auth: No
- Content-Type: application/json

## Body
```
{"email":"admin@example.com","password":"adminpass"}
```

## Expected Result
- Returns JWT token and user object.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
