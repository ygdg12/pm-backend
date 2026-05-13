# GET /api/files/:id

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/files/{id}
- Auth: No
- Content-Type: None

## Body
```
None
```

## Expected Result
- Download GridFS file by id.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
