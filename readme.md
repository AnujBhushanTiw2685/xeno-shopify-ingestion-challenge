# 🚀 Xeno Shopify Data Ingestion & Insights Service

Forward Deployed Engineer — Internship Assignment (2025)
Built using MERN + MySQL + Prisma

## 📌 Overview

This project implements a multi-tenant-ready Shopify Data Ingestion and Insights Platform, simulating how Xeno helps enterprise retailers integrate, sync, and analyze Shopify store data.

It includes:

Shopify → Backend → MySQL ingestion (Products, Customers, Orders)

JWT-secured Dashboard with insights

Trend charts, summaries, and top customer analytics

Cron-based background sync

Fully deployed backend + frontend

## 🏗️ Tech Stack
Layer	Tech
Frontend	React (Vite)
Backend	Node.js, Express.js
Database	MySQL (with Prisma ORM)
Auth	JWT, bcrypt
Charts	Recharts
Hosting	Frontend → Vercel, Backend → Render
Scheduler	node-cron
Integrations	Shopify Admin REST API
⚙️ Setup Instructions
1️⃣ Clone the repo
git clone https://github.com/YOUR_USERNAME/xeno-shopify-ingestion.git
cd xeno-shopify-ingestion

2️⃣ Backend Setup (/backend folder)
 cd backend
npm install

Create .env file
PORT=4000

### Shopify Credentials
SHOPIFY_STORE_DOMAIN=your-dev-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-10

### Database
DATABASE_URL="mysql://xeno_user:xeno_pwd@localhost:3306/xeno_shopify"

### JWT
JWT_SECRET="xeno_super_secret"

Run Prisma migrations
npx prisma migrate dev --name init

Start backend
npm start


Runs at:

http://localhost:4000

3️⃣ Frontend Setup (/frontend)
cd frontend
npm install

Create .env file
VITE_API_BASE_URL=http://localhost:4000

Start frontend
npm run dev


Runs at:

http://localhost:5173

### 🧱 Database Schema (Prisma)
model Product {
  id        Int     @id @default(autoincrement())
  shopifyId BigInt  @unique
  title     String
  price     Decimal?
}

model Customer {
  id         Int     @id @default(autoincrement())
  shopifyId  BigInt  @unique
  firstName  String?
  lastName   String?
  email      String?
  phone      String?
  totalSpent Decimal?
}

model Order {
  id                Int      @id @default(autoincrement())
  shopifyId         BigInt   @unique
  customerShopifyId BigInt?
  totalPrice        Decimal?
  currency          String?
  financialStatus   String?
  fulfillmentStatus String?
  processedAt       DateTime?
}

model AdminUser {
  id       Int    @id @default(autoincrement())
  email    String @unique
  password String
}

## 🛰️ API Endpoints
### 🔐 Auth
Method	Endpoint	Description
POST	/api/auth/register	Register an admin user
POST	/api/auth/login	Login & generate JWT
🛒 Shopify Sync APIs
Method	Endpoint	Description
POST	/api/shopify/sync-products	Ingest all products
POST	/api/shopify/sync-customers	Ingest customers
POST	/api/shopify/sync-orders	Ingest orders

### 📊 Metrics APIs (JWT Protected):
Method	Endpoint	Description
GET	/api/metrics/summary	Total customers, orders, revenue
GET	/api/metrics/orders-by-date?from=YYYY-MM-DD&to=YYYY-MM-DD	Trend chart data
GET	/api/metrics/top-customers	Top 5 customers by spend
## 🧭 High-Level Architecture Diagram
          ┌────────────────┐
          │ Shopify Store  │
          │(Products, Cust,│
          │   Orders)      │
          └───────┬────────┘
                  │ REST API
                  ▼
        ┌───────────────────────┐
        │    Node.js Backend    │
        │  Express + Prisma     │
        ├───────────────────────┤
        │ - Sync Shopify Data   │
        │ - JWT Auth            │
        │ - Metrics API         │
        │ - Cron Scheduler      │
        └───────┬──────────────┘
                │ Prisma ORM
                ▼
        ┌───────────────────────┐
        │       MySQL DB        │
        │ Products/Customers/   │
        │ Orders/AdminUser      │
        └───────┬──────────────┘
                │ JSON APIs
                ▼
        ┌───────────────────────┐
        │     React Frontend    │
        │   Vercel Deployment   │
        │ Charts + Insights UI  │
        └───────────────────────┘


(You can replace this with a PNG diagram in your repo.)

### ✨ Features Implemented
🔄 Shopify Data Ingestion

Fetches products, customers, and orders

Uses upsert for idempotent syncing

Background sync every 30 minutes via cron

📊 Dashboard Insights

Total customers, orders, revenue

Orders & revenue trend chart

Top 5 customers by spend

🔐 Secure Access

JWT authentication

bcrypt password hashing

Protected API routes

🧱 Clean Multi-Tenant Ready Backend

Each record tied to Shopify ID

Can easily add tenantId column for multiple stores

📌 Assumptions

Single Shopify store (multi-tenancy can be added by including tenantId)

Shopify REST API access token has read permissions

MySQL is running locally or via cloud provider

Orders contain customer references (required for top-customer insights)

⚠️ Known Limitations

No support for webhooks (sync relies on cron)

Does not ingest abandoned cart events (bonus scope)

No pagination handling beyond 250 items

No UI for onboarding multiple tenants

🚀 Next Steps for Production

Move to Shopify Webhooks instead of cron

Add multi-tenant schema (via tenantId)

Add Redis-based event queue for ingestion

Add retries + error alerting

Deploy database to AWS RDS / PlanetScale

Add role-based admin dashboard

Add caching for analytics endpoints

## 🌐 Deployment Instructions
Backend → Render

Create new Web Service

Connect GitHub repo

Set Build Command: npm install

Set Start Command: npm start

Add required Environment Variables

Add Render Cron Job (optional)

Frontend → Vercel

Import GitHub repo

Set environment variable:

VITE_API_BASE_URL=https://your-render-backend-url


Deploy