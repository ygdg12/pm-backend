# POST /api/auth/register/manager

Two supported ways to register (pick one).

---

## Option A — Raw JSON (easiest in Postman)

- **Body** → **raw** → **JSON**
- **Headers:** `Content-Type: application/json` (Postman sets this automatically for raw JSON)

### Body shape

```json
{
  "fullName": "Jane Manager",
  "email": "manager@example.com",
  "phoneNumber": "0911000000",
  "password": "yourSecurePassword",
  "propertyOwnershipProofBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "telebirrMerchantAccountProofBase64": "data:image/png;base64,iVBORw0KGgo..."
}
```

Each proof field can be:

- A **data URL**: `data:image/jpeg;base64,<payload>`
- Or **plain base64** (server assumes `image/jpeg`)

You can also use nested objects: `"propertyOwnershipProof": { "base64": "...", "filename": "doc.jpg" }`.

---

## Option B — multipart/form-data (files)

- **Body** → **form-data**
- **Do not** manually set `Content-Type` (let Postman add `boundary=...`)

| Key | Type |
|-----|------|
| fullName | Text |
| email | Text |
| phoneNumber | Text |
| password | Text |
| propertyOwnershipProof | File (image) |
| telebirrMerchantAccountProof | File (image) |

---

## Expected result

- **201** — manager created, `accountStatus` pending until admin approves.
- **400** — missing fields or invalid images.
