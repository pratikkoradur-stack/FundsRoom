# Mini ERP + CRM Operations Portal

A full-stack Operations Portal designed for wholesale and distribution businesses to manage **Customers (CRM)**, **Product Inventory & Stock Movements**, and **Sales Delivery Challans** with real-time stock deduction, audit trails, and role-based access control (RBAC).

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, TypeScript (`tsx` runner), Zod (schema validation), JSON Web Tokens (JWT), Bcrypt.js
- **Database**: Supabase PostgreSQL (`@supabase/supabase-js` service role client)
- **Frontend**: HTML5, Vanilla CSS3 (Custom Admin System), JavaScript (ES6+), GSAP (GreenSock Animation Platform)
- **Authentication**: Custom JWT-based Auth with Role-Based Access Control (`admin`, `sales`, `warehouse`, `accounts`)

---

## 📁 Project Structure

```text
Fundsroom/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT verification & role guard middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # POST /api/auth/login, GET /api/auth/me
│   │   │   ├── customers.ts       # Customer CRM CRUD, search, filter, notes
│   │   │   ├── products.ts        # Inventory CRUD, stock IN/OUT, movement history
│   │   │   └── challans.ts        # Sales Challans, snapshot data, stock deduction
│   │   ├── index.ts               # Express entrypoint with CORS & routes
│   │   ├── supabaseClient.ts      # Supabase Client setup
│   │   └── validators/
│   │       └── index.ts           # Zod validation schemas
│   ├── .env                       # Active environment variables
│   ├── .env.example               # Environment variables template
│   ├── package.json               # Backend npm scripts & dependencies
│   ├── postman_collection.json    # Complete ready-to-import Postman API collection
│   ├── schema.sql                 # PostgreSQL DDL script for Supabase
│   ├── seed.ts                    # Database seed script for default role accounts
│   └── test_api.ts                # Automated end-to-end integration test suite
│
└── frontend/
    ├── css/
    │   └── style.css              # Glassmorphic dark admin UI stylesheet
    ├── js/
    │   ├── api.js                 # Centralized fetch wrapper attaching JWT token
    │   ├── auth.js                # Login page handler & quick test role login
    │   ├── layout.js              # Sidebar injection, GSAP animations & logout
    │   ├── customers.js           # Customer CRM page logic & follow-up notes
    │   ├── products.js            # Products & inventory management page logic
    │   └── challans.js            # Sales Challans & multi-item builder
    ├── index.html                 # Login page
    ├── customers.html             # Customer CRM page
    ├── products.html              # Product Catalog & Stock page
    └── challans.html              # Sales Challans page
```

---

## 🔑 Test Login Credentials

| Role | Email | Password | Allowed Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@company.com` | `admin123` | Full access across all modules |
| **Sales** | `sales@company.com` | `admin123` | Customer CRM, Create Challans, Add Follow-up Notes |
| **Warehouse** | `warehouse@company.com` | `admin123` | Product Catalog, Manual Stock Adjustments (IN/OUT), Movement Logs |
| **Accounts** | `accounts@company.com` | `admin123` | Read-only view for Challans & Customer Accounts |

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **Supabase Account**: Free PostgreSQL project created at [supabase.com](https://supabase.com)

### 2. Backend Setup
Navigate to the `backend/` folder:
```bash
cd backend
npm install
```

### 3. Database Schema Setup
1. Log into your **Supabase Dashboard**.
2. Open the **SQL Editor**.
3. Copy the contents of `backend/schema.sql` and run it to create tables (`users`, `customers`, `products`, `stock_movements`, `challans`) and disable RLS (since auth is handled by Express).

### 4. Configure Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory:
```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
JWT_SECRET=your-custom-jwt-secret-key
```

### 5. Seed Initial Role Users
Run the seeding script to populate default accounts for all 4 roles:
```bash
npm run seed
```

### 6. Start Dev Server
```bash
npm run dev
```
The server will start running on **`http://localhost:5000`**.

### 7. Run Automated E2E API Tests
To verify all REST endpoints, validation logic, and stock deduction workflows:
```bash
npx tsx test_api.ts
```

### 8. Frontend Launch
Open `frontend/index.html` in your web browser (or serve using VS Code Live Server / static file server).
Use the quick one-click test buttons on the login page to log in as any of the 4 roles!

---

## 🛰️ REST API Endpoints Overview

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate email/password and receive JWT token.
- `GET /api/auth/me` — Return profile of currently authenticated user.

### Customer CRM (`/api/customers`)
- `GET /api/customers` — List customers with search, status/type filters, and pagination.
- `POST /api/customers` — Create a new customer (Admin, Sales).
- `GET /api/customers/:id` — Get customer profile details.
- `PUT /api/customers/:id` — Update customer details (Admin, Sales).
- `POST /api/customers/:id/notes` — Append follow-up note and update next follow-up date (Admin, Sales).

### Products & Inventory (`/api/products`)
- `GET /api/products` — List catalog items with search, category filter, and `low_stock=true` filter.
- `POST /api/products` — Create new catalog product (Admin, Warehouse).
- `GET /api/products/:id` — Get product details.
- `PUT /api/products/:id` — Update product details (Admin, Warehouse).
- `POST /api/products/:id/stock` — Manual stock IN/OUT adjustment. Automatically inserts audit record into `stock_movements`.
- `GET /api/products/:id/movements` — Fetch stock movement audit history for a product.

### Sales Challans (`/api/challans`)
- `GET /api/challans` — List sales challans with status & customer filtering.
- `POST /api/challans` — Create Sales Challan as `Draft` or `Confirmed`.
  - **Stock Check**: If `Confirmed`, verifies stock availability for all items. Returns `400 Bad Request` with exact item stock deficit if stock is insufficient.
  - **Stock Deduction**: Automatically deducts product stock and logs `stock_movements` (type `OUT`).
- `GET /api/challans/:id` — Get detailed sales challan with item snapshots and customer details.
- `PUT /api/challans/:id/status` — Transition status (`Draft` -> `Confirmed` or `Confirmed` -> `Cancelled`). Stock is restored automatically if a confirmed challan is cancelled.

---

## 📬 Postman Collection

A complete Postman collection is included at **`backend/postman_collection.json`**.
1. Open Postman -> Click **Import**.
2. Select `backend/postman_collection.json`.
3. Running `Login (Admin)` will automatically set the `authToken` variable for all subsequent requests!

---

## 🚀 Deployment Instructions

### Backend (Render / Railway / Fly.io)
1. Push the code to a GitHub repository.
2. Create a new **Web Service** on Render or Railway pointing to the `backend/` directory.
3. Build Command: `npm run build`
4. Start Command: `npm run start`
5. Environment Variables: Set `PORT`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET`.

### Database (Supabase)
Already hosted in cloud on Supabase PostgreSQL.

### Frontend (Vercel / Netlify / Render Static Site)
1. Deploy `frontend/` directory to Vercel or Netlify as a static website.
2. In `frontend/js/api.js`, update `API_BASE_URL` to point to your live deployed backend URL (e.g. `https://your-backend.onrender.com/api`).
