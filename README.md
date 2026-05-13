# National Digital Building System (Backend)

Node.js + Express + MongoDB (GridFS) backend designed for deployment on **Render**.

## Features (based on requirements)
- Role-based accounts: **Admin**, **Property Manager**, **Tenant**, **Visitor**
- Property search + filters
- Property manager: CRUD property listings + unit details + image uploads
- Tenant onboarding via **QR invite token**
- Digital lease agreement generation + signing by tenant and manager
- Complaint submission (optional photo)
- Telebirr payment endpoints (initiate + webhook with signature verification stub)

## Run locally
1. Copy `.env.example` to `.env` and fill values.
2. Start:
   - `npm install`
   - `npm run dev`

## Render deployment
Render will run `npm start` using the provided `Procfile`.

Ensure Render Environment Variables include at least:
- `MONGODB_URI` (or `DATABASE_URL`)
- `JWT_SECRET`

Optional (recommended for seeded admin login):
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## API base
- `/api/auth/*`
- `/api/invites/*`
- `/api/properties/*`
- `/api/leases/*`
- `/api/complaints/*`
- `/api/payments/*`
- `/api/admin/*`
- `/api/files/:id` (GridFS download)

