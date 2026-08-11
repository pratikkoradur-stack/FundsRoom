# FUNDSROOM ERP — Wholesale Operations Platform

A modern, cinematic, high-performance **ERP & CRM Platform** tailored for wholesale and distribution businesses. Fundsroom ERP provides end-to-end operational visibility across **Customer CRM**, **Inventory Catalog & Stock Health**, **Sales Delivery Challans**, **GST Invoicing**, and **Financial Control Analytics** with role-based security.

---

## 🎨 Visual Identity & Theme System

- **Primary Background**: Warm Ivory / Off-White (`#FAF8F5`)
- **Primary Brand Color**: Deep Burgundy / Maroon (`#5A1020`)
- **Secondary Brand Color**: Maroon (`#7A1F32`)
- **Muted Accent**: Muted Bronze / Amber (`#9A5A32`)
- **Neutral Borders & Cards**: Soft Warm Neutral (`#E9DED7`) & Pure White (`#FFFFFF`)
- **Typography**: Google Fonts **Bebas Neue** (Headings & Metrics) & **Inter** (UI Elements & Body)

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System with CSS Variables), JavaScript (ES6+), GSAP (GreenSock Animation Platform with ScrollTrigger)
- **Backend API**: Node.js, Express.js, TypeScript, Zod Schema Validation, JSON Web Tokens (JWT), Bcrypt.js
- **Database**: Supabase PostgreSQL (`@supabase/supabase-js` service role client)
- **Deployment**:
  - **Backend**: Railway (Node.js Express backend)
  - **Frontend**: Vercel Static Hosting (`vercel.json` routing configuration)

---

## 🚀 Key Application Pages & Features

### 1. Cinematic Welcome Landing Page (`index.html`)
- **Full-Width Hero Video**: Ambient background video with play/pause and mute/unmute audio controls.
- **Interactive Micro-Animations**: Cursor-tracking radial glow (`glow-card`), 3D perspective mouse tilt (`tilt-card`), and infinite marquee scrolling bands.
- **6-Step Interactive Business Workflow**: Numbered process grid (`01-06`) covering Customer CRM, Product Catalog, Inventory Health, Sales Challans, GST Invoices, and Payment Reconciliation.
- **Live Interactive Product Experience Preview**: Embedded interactive dashboard mockup.

### 2. Authentication Portal (`login.html`)
- **2-Column Fintech Layout**: Left-side media card with video timer (`00:03 / 00:06`), play/pause controls, and right-side authentication form.
- **Password Controls & Quick Test Roles**: Eye icon toggle, remember me checkbox, Google SSO option, and 4 one-click test role login buttons (`Admin`, `Sales`, `Warehouse`, `Accounts`).

### 3. Executive Control Room Dashboard (`dashboard.html`)
- **Financial KPI Cards**: Today's Sales, Month's Revenue, Customer Count, and Low Stock Alerts computed dynamically from live database records.
- **Revenue Flow Bar Chart**: Visual monthly revenue comparison with deep burgundy highlight bar.
- **ERP Transactions Widget**: Real wholesale client payments (`Apex Global Logistics`, `Malhotra Enterprises`) and stock replenishment entries.
- **Recent Sales Challans & Low Stock Tables**: Real-time tables connected directly to PostgreSQL database endpoints.

### 4. Core Admin ERP Modules
- **Customer CRM (`customers.html`)**: Manage wholesale accounts, lead statuses (`Lead`, `Active`, `Inactive`), client types (`Wholesale`, `Distributor`, `Retailer`), and follow-up notes.
- **Products & Inventory (`products.html`)**: SKU tracking, wholesale unit pricing, warehouse rack locations, manual stock adjustments (IN/OUT), and low-stock alert badges.
- **Sales Challans (`challans.html`)**: Multi-item delivery challan generator with automatic inventory stock reservation, status workflow (`Draft` → `Confirmed` → `Cancelled`), and print-ready official GST invoices.

---

## 📁 Project File Structure

```text
Fundsroom/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts            # JWT authentication & role guard middleware
│   │   ├── routes/
│   │   │   ├── auth.ts            # Authentication endpoints (/api/auth/login, /me)
│   │   │   ├── customers.ts       # Customer CRM CRUD & follow-up notes
│   │   │   ├── products.ts        # Products catalog & inventory adjustments
│   │   │   └── challans.ts        # Sales delivery challans & stock deduction
│   │   ├── index.ts               # Express application server entrypoint
│   │   ├── supabaseClient.ts      # Supabase PostgreSQL client initialization
│   │   └── validators/
│   │       └── index.ts           # Zod schema validation rules
│   ├── .env                       # Environment variables
│   ├── package.json               # Backend dependencies & npm scripts
│   ├── schema.sql                 # PostgreSQL DDL script for Supabase
│   └── seed.ts                    # Database seed script for test accounts
│
├── frontend/
│   ├── assets/                    # Media assets & background videos
│   ├── css/
│   │   ├── style.css              # Main unified admin portal stylesheet
│   │   ├── dashboard.css          # Executive dashboard control room stylesheet
│   │   ├── login.css              # Standalone authentication page stylesheet
│   │   └── welcome.css            # Cinematic landing page stylesheet
│   ├── js/
│   │   ├── api.js                 # Centralized fetch wrapper with JWT token handling
│   │   ├── auth.js                # Login page handler & role quick logins
│   │   ├── dashboard.js           # Live database analytics computation & UI updates
│   │   ├── layout.js              # Dynamic sidebar injection & navigation
│   │   ├── welcome.js            # Landing page GSAP animations & video controls
│   │   ├── customers.js           # Customer CRM page logic & modal popups
│   │   ├── products.js            # Products & inventory management page logic
│   │   └── challans.js            # Sales Challan builder & print invoice renderer
│   ├── index.html                 # Welcome Landing Page
│   ├── login.html                 # Authentication Portal Page
│   ├── dashboard.html             # Executive Control Room Dashboard Page
│   ├── customers.html             # Customer CRM Page
│   ├── products.html              # Products & Inventory Page
│   └── challans.html              # Sales Challans Page
│
├── vercel.json                    # Vercel deployment routing configuration
└── README.md                      # Comprehensive project documentation
```

---

## 🔑 Test Login Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@company.com` | `admin123` | Full access across all ERP modules |
| **Sales Manager** | `sales@company.com` | `admin123` | Customer CRM, Create Sales Challans, Add Notes |
| **Warehouse Supervisor** | `warehouse@company.com` | `admin123` | Product Catalog, Stock Adjustments, Movement History |
| **Accounts Executive** | `accounts@company.com` | `admin123` | Read-only view for Challans, Financial Analytics & Ledger |

---

## ⚡ Quick Start & Local Development

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **Supabase Account**: PostgreSQL database instance created at [supabase.com](https://supabase.com)

### 2. Backend Setup & Run
```bash
cd backend
npm install
npm run seed  # Seed initial test role accounts
npm run dev   # Start API server on http://localhost:5000
```

### 3. Frontend Local Access
Serve the `frontend/` directory using any local web server or open `index.html` directly in your browser:
```bash
# Example using Node static server or VS Code Live Server
npx serve frontend -p 3000
```
Open `http://localhost:3000/index.html` (or `http://localhost:5000/` if Express static hosting is active).

---

## 📜 License & Copyright

&copy; 2026 **Fundsroom ERP**. All rights reserved. Built for wholesale and distribution operations.
