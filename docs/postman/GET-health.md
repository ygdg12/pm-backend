# GET /health

## Postman Setup
- Method: GET
- URL: {{baseUrl}}/health
- Auth: No
- Content-Type: None

## Body
```
None
```

## Expected Result
- Health check endpoint.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
