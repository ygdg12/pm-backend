# Postman Endpoint Docs

Base URL example: http://localhost:3000

Set Postman variable baseUrl and use {{baseUrl}} in requests.

Set Bearer token in Authorization tab for protected endpoints.

## 1) System
- [GET /health](./GET-health.md)

## 2) Auth
- [POST /api/auth/login](./POST-api-auth-login.md)
- [POST /api/auth/register/manager](./POST-api-auth-register-manager.md) (multipart files)
- [POST /api/auth/register/manager/json](./POST-api-auth-register-manager-json.md) (JSON + base64)
- [POST /api/auth/register/visitor](./POST-api-auth-register-visitor.md)
- [POST /api/auth/register/tenant](./POST-api-auth-register-tenant.md)

## 3) Properties
- [GET /api/properties](./GET-api-properties.md) (tenant, visitor, manager — managers see only their listings)
- [GET /api/properties/mine](./GET-api-properties-mine.md) (manager — own listings, same `{ "properties": [...] }` shape)
- [GET /api/properties/:id](./GET-api-properties-id.md)
- [POST /api/properties](./POST-api-properties.md)
- [PATCH /api/properties/:id](./PATCH-api-properties-id.md)
- [DELETE /api/properties/:id](./DELETE-api-properties-id.md)

## 4) Leases
- [GET /api/leases/me](./GET-api-leases-me.md)
- [GET /api/leases/:id](./GET-api-leases-id.md)
- [POST /api/leases/:id/sign/tenant](./POST-api-leases-id-sign-tenant.md)
- [POST /api/leases/:id/sign/manager](./POST-api-leases-id-sign-manager.md)

## 5) Lease requests (application flow)

Step **7** (appointment after digital approval) uses the same **GET `/me`** and **GET `/:id`** responses — see those docs for response field names.

- [POST /api/lease-requests](./POST-api-lease-requests.md)
- [GET /api/lease-requests/me](./GET-api-lease-requests-me.md)
- [GET /api/lease-requests/:id](./GET-api-lease-requests-id.md)
- [GET /api/lease-requests/manager/inbox](./GET-api-lease-requests-manager-inbox.md)
- [PATCH /api/lease-requests/:id/review](./PATCH-api-lease-requests-id-review.md)
- [POST /api/lease-requests/:id/additional-documents](./POST-api-lease-requests-id-additional-documents.md)
- [PATCH /api/lease-requests/:id/complete-physical](./PATCH-api-lease-requests-id-complete-physical.md)

## 6) Complaints
- [POST /api/complaints](./POST-api-complaints.md)
- [GET /api/complaints/me](./GET-api-complaints-me.md)
- [GET /api/complaints](./GET-api-complaints.md)

## 7) Payments (Telebirr)
- [POST /api/payments/telebirr/initiate](./POST-api-payments-telebirr-initiate.md)
- [GET /api/payments/me](./GET-api-payments-me.md)
- [POST /api/payments/telebirr/webhook](./POST-api-payments-telebirr-webhook.md)

## 8) Files
- [GET /api/files/:id](./GET-api-files-id.md)

## 9) Admin
- [GET /api/admin/managers/pending](./GET-api-admin-managers-pending.md)
- [PATCH /api/admin/managers/:id/approve](./PATCH-api-admin-managers-id-approve.md)
- [PATCH /api/admin/managers/:id/reject](./PATCH-api-admin-managers-id-reject.md)
- [GET /api/admin/transactions/summary](./GET-api-admin-transactions-summary.md)
