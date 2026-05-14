# Lease requests — one-file reference (Postman / Insomnia)

Use variable `{{baseUrl}}` (e.g. `http://localhost:3000`). Send `Authorization: Bearer <JWT>` on every call below.

Replace `{leaseRequestId}` with the Mongo `_id` of the lease request (from step 2 or 4).

---

## Step 1 — Tenant: request lease

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/lease-requests` |
| **Auth** | Tenant Bearer token |
| **Body** | `multipart/form-data` |

### Required form fields

| Field (any one spelling) | Value |
|--------------------------|--------|
| `propertyId` or `property_id` | Property `_id` |
| `unitId` or `unit_id` | Unit subdocument `_id` (24-char hex from property payload, **not** a display number like `2`) |
| `desiredMoveInDate` or `desired_move_in_date` | e.g. `2026-06-01` |
| `leaseDurationMonths` or `lease_duration_months` | e.g. `12` |
| `numberOfOccupants` or `number_of_occupants` | e.g. `2` |
| **File** (one key) | `nationalId`, `national_id`, `idDocument`, `id_document`, `passport`, or often `file` / `photo` / `upload` — attach **one** image or PDF |

### Optional

| Field | Value |
|-------|--------|
| `messageToLandlord` or `message_to_landlord` | Text |

---

## Step 2 — Tenant: list my applications

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/lease-requests/me` |
| **Auth** | Tenant |
| **Body** | None |

After **step 5 `approve_digital`**, each item in `leaseRequests[]` can include: `appointmentDate`, `officeLocation`, `requiredDocumentsBring`, `status`, `statusDisplay`.

---

## Step 3 — Tenant / manager / admin: one application

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/lease-requests/{leaseRequestId}` |
| **Auth** | Tenant (own), manager (own property), or admin |
| **Body** | None |

Same appointment fields on `leaseRequest` after digital approval (step 7 = same GET, no new URL).

---

## Step 4 — Manager: inbox

| Item | Value |
|------|--------|
| **Method** | `GET` |
| **URL** | `{{baseUrl}}/api/lease-requests/manager/inbox` |
| **Auth** | Manager |
| **Body** | None |

### Optional query

| Key | Example |
|-----|---------|
| `propertyId` or `property_id` | Property `_id` |
| `status` | `pending_review`, `under_review`, `additional_documents_requested`, `meeting_scheduled`, `rejected`, `approved_awaiting_physical`, `completed_active_resident` |

---

## Step 5 — Manager: review (`PATCH` + JSON)

| Item | Value |
|------|--------|
| **Method** | `PATCH` |
| **URL** | `{{baseUrl}}/api/lease-requests/{leaseRequestId}/review` |
| **Auth** | Manager (for that property) |
| **Headers** | `Content-Type: application/json` |
| **Body** | **Raw JSON** (not form-data). Must include exact string **`action`** — one of the five names below. Wrong or missing `action` → `Invalid action...` |

### Valid `action` values (exact spelling)

`mark_under_review` · `reject` · `request_additional_documents` · `schedule_meeting` · `approve_digital`

### Copy-paste bodies (pick one per request)

**mark_under_review**

```json
{"action":"mark_under_review"}
```

**reject** (reason required)

```json
{"action":"reject","rejectionReason":"Unit no longer available."}
```

**request_additional_documents** (note required)

```json
{"action":"request_additional_documents","additionalDocumentsNote":"Please upload proof of income (PDF or photo)."}
```

**schedule_meeting** (datetime required; location/notes optional)

```json
{"action":"schedule_meeting","scheduledMeetingAt":"2026-06-15T10:00:00.000Z","meetingLocation":"Main office","meetingNotes":"Bring original ID."}
```

**approve_digital** (appointment + office + documents list — all required)

```json
{"action":"approve_digital","appointmentDate":"2026-06-20T09:00:00.000Z","officeLocation":"Bole, Building X, 2nd floor","requiredDocumentsBring":"Original ID, two photos, deposit receipt."}
```

Snake_case also works: `rejection_reason`, `additional_documents_note`, `scheduled_meeting_at`, `meeting_location`, `meeting_notes`, `appointment_date`, `office_location`, `required_documents_bring`.

---

## Step 6 — Tenant: extra documents (after manager requests them)

| Item | Value |
|------|--------|
| **Method** | `POST` |
| **URL** | `{{baseUrl}}/api/lease-requests/{leaseRequestId}/additional-documents` |
| **Auth** | Tenant |
| **Body** | `multipart/form-data` — at least one file on **`additionalDocument`** or **`additional_document`** |

Allowed only when `status` is `additional_documents_requested`.

---

## Step 7 — Tenant: see appointment (no new endpoint)

Use **step 2** or **step 3** responses. Read `appointmentDate`, `officeLocation`, `requiredDocumentsBring` on each `leaseRequest` when status is `approved_awaiting_physical`.

---

## Step 8 — Manager: complete physical (after digital approval)

| Item | Value |
|------|--------|
| **Method** | `PATCH` |
| **URL** | `{{baseUrl}}/api/lease-requests/{leaseRequestId}/complete-physical` |
| **Auth** | Manager |
| **Body** | `application/json` **or** `multipart/form-data` |

Allowed only when `status` is `approved_awaiting_physical`.

### JSON example (all body fields optional; names recommended)

```json
{
  "physicalCompletionNotes": "ID verified, deposit received, keys handed over.",
  "tenantSignatoryName": "Tenant Full Name",
  "managerSignatoryName": "Manager Full Name"
}
```

### Multipart (optional files)

Same keys as text fields, plus optional files: `digitalCopy` / `digital_copy`, `signedContractPhoto` / `signed_contract_photo` (repeat for multiple photos).

---

## Per-endpoint markdown (same project)

Individual files still exist under `docs/postman/` (e.g. `POST-api-lease-requests.md`). This file is the **single** copy-paste reference for the whole flow.
