# PATCH /api/properties/:id

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/properties/{id}
- Auth: Bearer manager token
- Content-Type: multipart/form-data

## Rules
- Send at least one field to update.
- After the update, the listing must still satisfy **all** required rules (same as create): compound name, owner name, street address, at least one unit with square meters and lease price, and at least one image. If your change would leave the property incomplete, the request fails with **400**.

## Body
```
Any of: name_of_compound, owner_name, street_address, units(JSON), images(file[])
```

If you replace images, upload at least one new image file (any file field name; `image/*` only).

## Expected Result
- **200** on success.
- **400** if validation fails.
