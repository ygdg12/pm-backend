# PATCH /api/lease-requests/:id/review

**Flow step 5 — Manager review.** JSON body: one `action` plus fields required for that action.

## Postman Setup
- Method: PATCH
- URL: {{baseUrl}}/api/lease-requests/{id}/review
- Auth: Bearer manager token (manager for that property)
- Content-Type: application/json

## Path
- `{id}` — Lease request Mongo `_id`.

## Values you must fill (always)

| Where | Value |
|-------|--------|
| Path `{id}` | Lease request Mongo `_id`. |
| Headers | `Authorization: Bearer <manager JWT>`, `Content-Type: application/json` |
| Body | JSON object including **`action`** (string). Other keys depend on `action` — see below. |

## Body — required keys per `action`

| `action` | Required JSON keys | Example values |
|----------|-------------------|----------------|
| `mark_under_review` | `action` only | `"mark_under_review"` |
| `reject` | `action`, `rejectionReason` (or `rejection_reason`) | Non-empty reason string |
| `request_additional_documents` | `action`, `additionalDocumentsNote` (or `additional_documents_note`) | What the tenant should upload |
| `schedule_meeting` | `action`, `scheduledMeetingAt` (or `scheduled_meeting_at`). Optional: `meetingLocation` / `meeting_location`, `meetingNotes` / `meeting_notes` | ISO datetime for meeting |
| `approve_digital` | `action`, `appointmentDate` (or `appointment_date`), `officeLocation` (or `office_location`), `requiredDocumentsBring` (or `required_documents_bring`) | Appointment as ISO date/time; office and “what to bring” as non-empty text |

## Copy-paste JSON examples

Send JSON with `action` and the fields required for that action.

### `mark_under_review`
```
{"action":"mark_under_review"}
```

### `reject`
```
{"action":"reject","rejectionReason":"Reason text is required"}
```

### `request_additional_documents`
```
{"action":"request_additional_documents","additionalDocumentsNote":"What to upload"}
```

### `schedule_meeting`
```
{"action":"schedule_meeting","scheduledMeetingAt":"2026-06-15T10:00:00.000Z","meetingLocation":"Office address (optional)","meetingNotes":"Notes (optional)"}
```

### `approve_digital` (conditional approval — awaiting physical visit)

Requires appointment and office details for the tenant.

```
{"action":"approve_digital","appointmentDate":"2026-06-20T09:00:00.000Z","officeLocation":"Building address","requiredDocumentsBring":"List what to bring"}
```

Snake_case aliases are accepted: `rejection_reason`, `additional_documents_note`, `scheduled_meeting_at`, `meeting_location`, `meeting_notes`, `appointment_date`, `office_location`, `required_documents_bring`.

## Expected Result
- Manager updates the application (review, reject, request documents, schedule meeting, or digital approval).
- Success status: 200 or 201 depending on endpoint.
- On validation/auth errors: 400, 401, 403, 404.
