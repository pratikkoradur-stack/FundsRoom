# ERP + CRM Operations Portal

## Tech Stack
Backend: Node.js, TypeScript, Express.js, Supabase (PostgreSQL)
Frontend: HTML, CSS, JavaScript, GSAP

## Architecture
The system follows a decoupled REST API architecture where an Express.js server written in TypeScript handles business logic and communicates directly with a Supabase PostgreSQL database using the Supabase Service Role client. Authentication is powered by JSON Web Tokens (JWT), with role-based access control (RBAC) enforced via custom Express middleware (`auth.ts`) for four key operational roles: Admin, Sales, Warehouse, and Accounts. The frontend is built with vanilla HTML/CSS/JavaScript with GSAP for animations, communicating asynchronously with the REST API using a centralized fetch module (`api.js`).

## Local Setup
1. Clone repo: `git clone <repository-url>`
2. Backend: `cd backend && npm install`
3. Copy `.env.example` to `.env` in the `backend/` directory, fill in Supabase URL/key + JWT secret
4. Run `schema.sql` in Supabase SQL Editor to create tables (`users`, `customers`, `products`, `challans`, `stock_movements`)
5. Seed users: `npx ts-node seed.ts` (or `npm run seed`) inside the `backend/` folder
6. Start backend: `npm run dev` (launches server on `http://localhost:5000`)
7. Frontend: open `frontend/index.html` in browser (or use Live Server / `npx serve frontend -p 3000`)

## Environment Variables
- `PORT`: The port number on which the backend Express REST API server runs (default: `5000`).
- `SUPABASE_URL`: The HTTPS URL of your Supabase project instance connected to PostgreSQL database.
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service role API key granting full backend administrative permissions to bypass table Row Level Security.
- `JWT_SECRET`: Secret key used for signing and verifying JSON Web Tokens issued during user authentication.

## Deployment
Backend deployed on: `https://fundsroom-erp-backend.onrender.com`
Frontend deployed on: `https://fundsroom-erp.vercel.app`
How deployment was done:
The Node.js Express backend was deployed to Render/Railway as a Web Service configured with root directory `backend`, build command `npm install && npm run build`, and start command `npm start`. The static frontend was deployed to Vercel/Netlify with static rewrites and automatic API URL resolution in `frontend/js/api.js`.

## Test Credentials
- `admin@erp.com` / `admin123` (Admin) [alias: `admin@company.com`]
- `sales@erp.com` / `admin123` (Sales) [alias: `sales@company.com`]
- `warehouse@erp.com` / `admin123` (Warehouse) [alias: `warehouse@company.com`]
- `accounts@erp.com` / `admin123` (Accounts) [alias: `accounts@company.com`]

## API Documentation
See `postman_collection.json` in repo root, or link below. Includes endpoints for Authentication (`/api/auth`), Customer CRM (`/api/customers`), Inventory Catalog & Stock Movements (`/api/products`), and Sales Delivery Challans (`/api/challans`).

## Known Limitations
- Frontend built in vanilla JS instead of React (time constraint) — all required functionality (dynamic data fetching, modal forms, status filtering, table pagination, role-based view permissions, printable GST invoice rendering) is fully implemented.
- Offline caching is not supported; live database API access is required for full functionality.
- Automated external SMS/Email notification delivery is omitted (invoices can be printed or saved to PDF via browser print API).

## Assumptions
- **Role Permissions Scope**: Admin has full system permissions; Sales Manager manages customers and creates sales delivery challans; Warehouse Supervisor manages product catalog and stock IN/OUT movements; Accounts Executive has read-only access for financial auditing and invoice ledgers.
- **Stock Reservation**: Automated inventory deduction occurs when a Sales Delivery Challan is confirmed (`Draft` → `Confirmed`).
- **Single Currency**: All prices and financial KPI analytics assume Indian Rupees (`₹`) formatted for B2B distribution operations.
- **Application Security**: Database Row Level Security (RLS) is turned off in favor of application-level JWT middleware role checks inside the Express API.
