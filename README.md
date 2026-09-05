# SmartCold - Cold Storage Management System (MERN)

> **Modern, responsive, full-stack Cold Storage Management System** designed for cold-storage operators, agricultural warehouses, and packhouse facilities.

---

## Key Features

- **Dashboard Overview**: Visual 90,000-packet capacity utilization bar (69.4% occupied), active chambers breakdown (Chamber A, B, C), live movement KPIs, monthly inward vs outward movement charts, commodity distribution, recent activity feeds, and real-time operational alerts.
- **Stock Inward (Add Stock)**: Fast operator intake workflow with auto-generated Entry IDs (`IN-2026-XXXX`), Lot IDs (`LOT-2026-XXXX`), and Receipt IDs (`RCP-2026-XXXX`). Automatic capacity validation prevents overloading chambers.
- **Live Inventory (Lots)**: Real-time lot management displaying original, released, and remaining stock, with storage duration counters (days/months) and instant multi-filtering.
- **Stock Release (Outward Dispatch)**: Support for partial and complete lot releases, automated transparent storage charge calculation based on duration & pricing schemes, customer ledger debit/credit tracking, and release receipt generation.
- **Tariff & Charge Calculation**: Automated calculation supporting *per packet*, *per bag*, *per month*, *per day*, and *fixed seasonal* rates with manual authorized adjustment options.
- **Billing & Printable Receipts**: Print-ready, branded receipts with `@media print` isolation for Inward Storage Receipts, Stock Release Receipts, Payment Receipts, and Customer Statements.
- **Customer Ledger**: Chronological double-entry running balance statement (Debit charges, Credit payments, Adjustments).
- **Reports & Multi-Format Exports**: Stock, Financial, and Capacity reports with date filters and 1-click export to **Excel (.xlsx)**, **PDF (.pdf)**, and **CSV**.
- **Zero-Setup Database Execution**: Ready for standard MongoDB via `.env`, with built-in embedded in-memory MongoDB fallback ensuring immediate, error-free demonstration.

---

## Demo Credentials

- **Email**: `admin@coldstorage.com`
- **Password**: `admin123`
*(A 1-click "Autofill Demo Admin" button is also provided on the login page)*

---

## Folder Structure

```
d:\Client Project Demo\DemoColdStorage\
├── server/
│   ├── src/
│   │   ├── config/ (db.js)
│   │   ├── controllers/ (auth, customer, commodity, chamber, stock, lot, payment, ledger, report, search, settings)
│   │   ├── middleware/ (auth.js)
│   │   ├── models/ (User, Customer, Commodity, Chamber, StockEntry, Lot, StockRelease, Payment, Transaction, Settings, ActivityLog)
│   │   ├── routes/ (auth, customer, commodity, chamber, stock, lot, payment, ledger, report, search, settings)
│   │   ├── utils/ (chargeCalculator.js, idGenerators.js)
│   │   ├── index.js
│   │   └── seed.js
│   ├── .env
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/ (CommodityPieChart, InwardOutwardChart, PaymentMonthlyChart)
│   │   │   ├── common/ (Badge, Button, ConfirmDialog, EmptyState, Input, Loader, Modal, Pagination, ReceiptModal, Select, StatCard, Table)
│   │   │   └── layout/ (AppLayout, Header, Sidebar)
│   │   ├── context/ (AuthContext, ToastContext)
│   │   ├── pages/
│   │   │   ├── Chambers/ (ChambersList)
│   │   │   ├── Commodities/ (CommoditiesList)
│   │   │   ├── CustomerLedger/ (CustomerLedgerPage)
│   │   │   ├── Customers/ (CustomersList, CustomerDetail, CustomerModal)
│   │   │   ├── Inventory/ (InventoryList)
│   │   │   ├── Payments/ (PaymentsList, PaymentModal)
│   │   │   ├── Reports/ (ReportsPage)
│   │   │   ├── Settings/ (SettingsPage)
│   │   │   ├── StockInward/ (StockInwardForm)
│   │   │   ├── StockRelease/ (StockReleaseForm)
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   └── NotFound.jsx
│   │   ├── services/ (api, auth, customer, commodity, chamber, stock, lot, payment, ledger, report, search, settings)
│   │   ├── utils/ (exportUtils, formatters)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

---

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install
npm run seed     # Seeds realistic Cold Storage demo data (90,000 capacity, lots, payments)
npm run dev      # Starts Express server on http://localhost:5001
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev      # Starts Vite React client on http://localhost:5174 or http://localhost:5175
```

Open your browser at `http://localhost:5174` (or `http://localhost:5175`), click **Autofill Demo Admin**, and explore the system.
