# DELETE /api/properties/:id

## Postman Setup
- Method: DELETE
- URL: {{baseUrl}}/api/properties/{id}
- Auth: Bearer manager token
- Content-Type: None

## Body
```
None
```

## Expected Result
- Delete own property.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
