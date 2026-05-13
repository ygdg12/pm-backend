# POST /api/auth/register/manager

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/auth/register/manager
- Auth: No
- Content-Type: multipart/form-data

## Body
```
fullName, email, phoneNumber, password, propertyOwnershipProof(file), telebirrMerchantAccountProof(file)
```

## Expected Result
- Creates manager account in pending state.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
