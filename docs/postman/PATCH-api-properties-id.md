# PATCH /api/properties/:id

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/properties/{id}
- Auth: Bearer manager token
- Content-Type: multipart/form-data

## Body
```
Any of: name_of_compound, owner_name, street_address, units(JSON), images(file[])
```

## Expected Result
- Update own property.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
