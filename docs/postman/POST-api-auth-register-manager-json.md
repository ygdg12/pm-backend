# POST /api/auth/register/manager/json

Same manager registration as `/register/manager`, but **without multipart files**: send **base64** (or data URLs) for the two proofs.

Use **`POST /api/auth/register/manager`** with **Multipart Form** when you want to upload real files from disk (recommended for Insomnia).

## Postman / Insomnia

- **Body** → **JSON**
- **Content-Type:** `application/json`

## Body example

```json
{
  "fullName": "Jane Manager",
  "email": "manager@example.com",
  "phoneNumber": "0911000000",
  "password": "yourSecurePassword",
  "propertyOwnershipProofBase64": "data:image/jpeg;base64,...",
  "telebirrMerchantAccountProofBase64": "data:application/pdf;base64,..."
}
```

Proof fields may be `image/*` or `application/pdf` data URLs, or plain base64 (defaults to image/jpeg).

## Response

- **201** — manager created (pending admin approval).
