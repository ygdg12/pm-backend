# POST /api/auth/register/manager

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/auth/register/manager
- Auth: No
- Content-Type: **Do not set manually.** Choose **Body → form-data** and let Postman send `multipart/form-data` with a boundary.

## Body (form-data)
Add **four text** rows and **two file** rows:

| Key | Type | Value |
|-----|------|--------|
| fullName | Text | e.g. Jane Manager |
| email | Text | e.g. manager@example.com |
| phoneNumber | Text | e.g. 0911000000 |
| password | Text | your password |
| propertyOwnershipProof | **File** | image (jpg/png) – proof of ownership |
| telebirrMerchantAccountProof | **File** | image (jpg/png) – Telebirr merchant proof |

Keys are **case-sensitive** (`fullName`, not `FullName` or `full_name` unless you use those aliases).

## If you see "fullName, email, phoneNumber and password are required"
1. **Body** must be **form-data**, not **raw** JSON (this route does not read raw JSON for those fields together with files).
2. Under **Headers**, **remove** any `Content-Type: multipart/form-data` you added by hand (without a boundary it breaks parsing and `req.body` stays empty).
3. Ensure each form row has the **checkbox enabled** (not greyed out).
4. File fields must be **type File** and images only (`image/*`).

## Expected Result
- Creates manager account in pending state.
- Success status: 201.
- On validation/auth errors: 400, 401, 403, 404.
