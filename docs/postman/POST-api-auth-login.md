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
- **Admin:** use the same `email` / `password` as `ADMIN_EMAIL` / `ADMIN_PASSWORD` in your server environment (e.g. Render). Those vars must be set or no admin user exists and you get `401 Invalid email or password`.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
