# POST /api/complaints

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/complaints
- Auth: Bearer active tenant token
- Content-Type: multipart/form-data

## Body
```
propertyId, unitId(optional), title, category, description(optional), photo(file optional)
```

## Expected Result
- Create complaint ticket.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
