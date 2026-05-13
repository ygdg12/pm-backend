# POST /api/properties

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/properties
- Auth: Bearer manager token
- Content-Type: multipart/form-data

## Body
```
name_of_compound, owner_name, street_address, units(JSON string array), images(file[] max 10)
```

## Expected Result
- Create property with units and images.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
