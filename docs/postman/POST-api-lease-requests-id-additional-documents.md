# POST /api/lease-requests/:id/additional-documents

**Flow step 6 — Extra docs (tenant).** Only when manager set `request_additional_documents`.

## Postman Setup
- Method: POST
- URL: {{baseUrl}}/api/lease-requests/{id}/additional-documents
- Auth: Bearer tenant token (must be the applicant)
- Content-Type: multipart/form-data

## Path
- `{id}` — Lease request Mongo `_id`.

## When allowed
- Only when the request `status` is `additional_documents_requested`.

## Values you must fill

| Where | Value |
|-------|--------|
| Path `{id}` | Same lease request `_id` as in step 1 response or from `GET .../me`. |
| Headers | `Authorization: Bearer <tenant JWT>` |
| Body (multipart) | **At least one file** on field name **`additionalDocument`** or **`additional_document`** (image or PDF). You can add more file parts with the same field name if your client supports it. |

## Body (files)

Use field name **`additionalDocument`** or **`additional_document`**. Upload one or more files (image or PDF, same rules as other document uploads).

## Expected Result
- Tenant uploads extra documents after the manager requested them.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
