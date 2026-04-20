# Engishu Insurance Agency — Full-Stack Web Application

Two-part application: **Public Website** (homepage + product pages + quote forms) and **Internal ERP** (staff dashboard, CRM, policy management).

## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router, Lucide Icons
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** SQLite (dev), PostgreSQL (production)
- **Auth:** JWT with bcrypt password hashing
- **Email:** Nodemailer with Gmail SMTP
- **Cron:** node-cron for daily renewal alerts

## Structure

```
/                    → Public homepage
/products/:slug      → Individual product pages (21 products)
/about               → About Us page
/contact             → Contact form page
/login               → Staff login portal
/dashboard           → ERP dashboard (after login)
/clients             → Client management
/leads               → Leads pipeline (Kanban + list)
/policies            → Policy management
/quotations          → Quotation management
/documents           → Document storage
/commissions         → Commission tracker (admin only)
/tasks               → Task manager
/settings            → User & company settings (admin only)
```

## Quote Form Flow

1. Visitor fills quote form on public website
2. Lead saved to database (source: "WEBSITE", status: "NEW")
3. Email sent to cover@engishu.com with client details
4. Lead appears in ERP Leads module automatically
5. Agent follows up, updates status
6. When converted → client record auto-created
7. Policy added when cover confirmed

## Default Login Credentials

| Role  | Email               | Password |
|-------|---------------------|----------|
| Admin | munene@engishu.com  | Admin123 |
| Agent | alvin@engishu.com   | Agent123 |
| Agent | beliya@engishu.com  | Agent123 |

## Local Development Setup

### Prerequisites
- Node.js 18+
- Git

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

```bash
cd server
cp .env.example .env
# SQLite works out of the box — no database setup needed
```

### 3. Database setup

```bash
cd server
npx prisma migrate dev --name init
node prisma/seed.js
```

### 4. Run both servers

```bash
# Terminal 1 — Backend (port 9247, localhost only)
cd server
npm run dev

# Terminal 2 — Frontend (port 9348, localhost only)
cd client
npm run dev
```

Open http://127.0.0.1:9348

## Environment Variables

| Variable       | Description                           | Example                    |
|----------------|---------------------------------------|----------------------------|
| DATABASE_URL   | Database connection string            | file:./dev.db              |
| JWT_SECRET     | Secret key for JWT signing            | your-secret-key            |
| JWT_EXPIRES_IN | Token expiry duration                 | 7d                         |
| ADMIN_EMAIL    | Email for admin notifications         | cover@engishu.com          |
| SMTP_USER      | Gmail address for sending emails      | your-email@gmail.com       |
| SMTP_PASS      | Gmail app password                    | your-app-password          |
| FRONTEND_URL   | Frontend URL for CORS                 | http://127.0.0.1:9348      |
| PORT           | Backend server port                   | 9247                       |

## Switching to PostgreSQL (Production)

1. In `server/prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`
2. Update `DATABASE_URL` in `.env` to your PostgreSQL connection string
3. Run `npx prisma migrate deploy`

## Deployment

### Frontend (Vercel)

1. Connect repo to Vercel, set root directory to `client`
2. Build command: `npm run build`, output: `dist`
3. Add rewrite rule: `/*` → `/index.html` (for SPA routing)
4. Set environment variable for API URL if backend is separate

### Backend (Railway)

1. Create project, add PostgreSQL database
2. Set root directory to `server`
3. Add all environment variables
4. Start command: `npm start`
5. Run `npx prisma migrate deploy` and `node prisma/seed.js`

## Modules

### Public Website
- Homepage with hero, stats, how-it-works, products, testimonials, FAQ
- 21 product pages (9 individual + 12 corporate) with quote forms
- About Us page with company story, mission, vision, leadership
- Contact page with form and WhatsApp link
- Responsive design, WhatsApp floating button

### Internal ERP
1. **Dashboard** — Admin/Agent overview cards, recent activity
2. **Client Management** — CRUD, search, filter, profiles with linked policies/documents
3. **Leads Pipeline** — Kanban + list view, website leads auto-appear, lead-to-client conversion
4. **Policy Management** — Full lifecycle, renewal alerts (red <7d, amber <30d)
5. **Quotation Management** — Status tracking, approved → policy conversion
6. **Document Storage** — Upload linked to clients, 5MB max, type whitelist
7. **Commission Tracker** — Admin-only, auto-calculated, per-agent breakdown
8. **Task Manager** — Priority, overdue highlighting, quick status toggle
9. **Settings** — User management, company details, password change

## Security

- JWT auth on all ERP routes, public routes rate-limited separately
- Role-based access (Admin sees all, Agent sees own data)
- Rate limiting: 10 login attempts/min, 200 requests/min global
- Security headers (X-Frame-Options DENY, XSS, nosniff, referrer policy)
- File uploads: type whitelist, 5MB limit, randomized filenames, path traversal protection
- Passwords hashed with bcrypt (12 rounds)
- Localhost-only binding in development (not visible on company network)

## Brand

- Primary: #30D5C8 (turquoise)
- Secondary: #633806 (brown)
- Background: #F7FFFE
- Font: Inter (system fallback)
- Style: Clean, modern, spacious
