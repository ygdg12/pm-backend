# Postman Endpoint Docs

Base URL example: http://localhost:3000

Set Postman variable baseUrl and use {{baseUrl}} in requests.

Set Bearer token in Authorization tab for protected endpoints.

## 1) System
- [GET /health](./GET-health.md)

## 2) Auth
- [POST /api/auth/login](./POST-api-auth-login.md)
- [POST /api/auth/register/manager](./POST-api-auth-register-manager.md)
- [POST /api/auth/register/visitor](./POST-api-auth-register-visitor.md)

## 3) Tenant Invitation
- [POST /api/invites](./POST-api-invites.md)
- [GET /api/invites/:token](./GET-api-invites-token.md)
- [POST /api/invites/:token/complete](./POST-api-invites-token-complete.md)

## 4) Properties
- [GET /api/properties](./GET-api-properties.md)
- [GET /api/properties/:id](./GET-api-properties-id.md)
- [POST /api/properties](./POST-api-properties.md)
- [PATCH /api/properties/:id](./PATCH-api-properties-id.md)
- [DELETE /api/properties/:id](./DELETE-api-properties-id.md)

## 5) Leases
- [GET /api/leases/me](./GET-api-leases-me.md)
- [GET /api/leases/:id](./GET-api-leases-id.md)
- [POST /api/leases/:id/sign/tenant](./POST-api-leases-id-sign-tenant.md)
- [POST /api/leases/:id/sign/manager](./POST-api-leases-id-sign-manager.md)

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
