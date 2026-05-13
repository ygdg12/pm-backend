# POST /api/invites

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/invites
- Auth: Bearer manager token
- Content-Type: application/json

## Body
```
{"propertyId":"<propertyId>","unitId":"<unitId>","tenantEmail":"tenant@example.com","expiresInMinutes":1440}
```

## Expected Result
- Generates invite token, invite URL and QR data URL.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
