# GET /api/properties

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/api/properties
- Auth: Bearer tenant or visitor token
- Content-Type: None

## Body
```
Query params optional: q, location, minPrice, maxPrice, minSize, availability
```

## Expected Result
- Search/list properties.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
