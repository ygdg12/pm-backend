# National Digital Building System (Backend)

Node.js + Express + MongoDB (GridFS) backend designed for deployment on **Render**.

## Features (based on requirements)
- Role-based accounts: **Admin**, **Property Manager**, **Tenant**, **Visitor**
- Property search + filters
- Property manager: CRUD property listings + unit details + image uploads
- Tenant self-registration via **`POST /api/auth/register/tenant`** (same idea as visitor signup; **kebeleId** required)
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

**Admin sign-in:** also set both `ADMIN_EMAIL` and `ADMIN_PASSWORD`. On every deploy/start the server upserts the single admin account and **syncs the password from `ADMIN_PASSWORD`**, so it matches what you set in Render. Use `POST /api/auth/login` with that email and password.

If admin login returns `401 Invalid email or password`, check that those two variables are set in Render (not only in a local `.env` file), then redeploy or restart the service.

## API base
- `/api/auth/*`
- `/api/properties/*`
- `/api/leases/*`
- `/api/complaints/*`
- `/api/payments/*`
- `/api/admin/*`
- `/api/files/:id` (GridFS download)

