# POST /api/auth/register/manager

**Use this URL for real file uploads** (Insomnia, Postman, browsers). No URLs in the body — attach files from disk.

---

## Insomnia

1. Method **POST** → URL `{{baseUrl}}/api/auth/register/manager`
2. **Body** tab → choose **Multipart Form** (not JSON, not GraphQL)
3. Add **Text** rows:

| Name | Value |
|------|--------|
| fullName | Your name (Insomnia may use `fullname` — both work) |
| email | your@email.com |
| phoneNumber | e.g. 0911000000 |
| password | your password |

4. Add **File** rows (click **File** type, then choose a file from your computer):

| Name | File |
|------|------|
| propertyOwnershipProof | ownership deed / scan (image or PDF) |
| telebirrMerchantAccountProof | Telebirr merchant proof (image or PDF) |

5. Do **not** paste file URLs. Insomnia must send the file as multipart parts.

**Alternate field names** (if you prefer): `property_ownership_proof`, `ownershipProof`, `telebirr_merchant_account_proof`, `telebirrProof`.

**Accepted types:** `image/*`, `application/pdf`, and `application/octet-stream` (common when Insomnia picks a file).

PDFs are uploaded to Cloudinary as **`raw`** assets (images use **`auto`**). If upload fails, the API returns **400** with `error.message` describing the Cloudinary error (not a generic 500).

---

## Postman

Body → **form-data** → Text + File rows with the same names as above.

---

## Optional: JSON + base64 only

If your tool cannot send multipart at all, use **[POST /api/auth/register/manager/json](./POST-api-auth-register-manager-json.md)** instead.

---

## Response

- **201** — manager created (pending admin approval).
