# PATCH /api/lease-requests/:id/complete-physical

**Flow step 8 — In-person done (manager).** Creates approved `LeaseAgreement`, completes request, syncs tenant to active resident when rules allow.

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/lease-requests/{id}/complete-physical
- Auth: Bearer manager token (manager for that property)
- Content-Type: `application/json` **or** `multipart/form-data` (if you attach files)

## Path
- `{id}` — Lease request Mongo `_id`.

## When allowed
- Only when `status` is `approved_awaiting_physical`.

## Values you must fill

| Where | Value |
|-------|--------|
| Path `{id}` | Lease request Mongo `_id` (must be in `approved_awaiting_physical`). |
| Headers | `Authorization: Bearer <manager JWT>` |

**Body — nothing is strictly required** (server defaults signatory names from tenant profile / JWT). Recommended:

| Field (JSON or multipart text) | Required? | Notes |
|--------------------------------|------------|--------|
| `physicalCompletionNotes` / `physical_completion_notes` | Recommended | What was done on site (ID check, deposit, keys, etc.). |
| `tenantSignatoryName` / `tenant_signatory_name` | Optional | Defaults to tenant `fullName` if omitted. |
| `managerSignatoryName` / `manager_signatory_name` | Optional | Defaults from token / `"Manager"` if omitted. |

**Multipart only — optional files**

| Field name | Value |
|------------|--------|
| `digitalCopy` or `digital_copy` | One optional file (scanned lease copy). |
| `signedContractPhoto` or `signed_contract_photo` | One or more optional photos of the signed contract. |

## Option A — JSON only

- Content-Type: application/json

### Body (optional fields)
```
{"physicalCompletionNotes":"ID verified, deposit received, keys handed over.","tenantSignatoryName":"Tenant Full Name","managerSignatoryName":"Manager Full Name"}
```

Snake_case: `physical_completion_notes`, `tenant_signatory_name`, `manager_signatory_name`.

## Option B — Multipart (optional uploads)

- Content-Type: multipart/form-data
- Same text fields as above **plus** optional files:
  - `digitalCopy` or `digital_copy` — one file
  - `signedContractPhoto` or `signed_contract_photo` — one or more photos of the signed contract

## Expected Result
- Manager marks in-person completion; creates an approved `LeaseAgreement` and activates resident status when applicable.
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
