# Engishu Insurance CRM — Claude Code Reference

## Project Overview
Full-stack Insurance Agency CRM for Engishu Insurance. Single Render.com deployment serving both the React frontend and Express API.

**Live URL:** https://engishu.onrender.com/
**GitHub:** https://github.com/Beliya470/engishu (account: Beliya470)
**Admin login:** email `munene`, password `Admin1234`

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Backend | Node.js + Express.js |
| ORM | Prisma v5 |
| DB (local) | SQLite (`file:./dev.db`) |
| DB (production) | PostgreSQL on Render.com |
| File storage | Cloudinary (production) / local disk (dev) |
| Auth | JWT (7d expiry) |
| Email | Nodemailer (SMTP) |
| Cron | node-cron (daily renewal alerts at 8am) |
| Hosting | Render.com (free tier, single web service) |

---

## Project Structure

```
playwright2/
├── client/                  # React frontend
│   ├── index.html           # viewport: width=device-width, initial-scale=1.0, maximum-scale=1.0
│   ├── .npmrc               # include=dev  (forces devDeps install on Render)
│   ├── src/
│   │   ├── index.css        # Global styles, overflow-x:hidden on html+body
│   │   ├── pages/
│   │   │   ├── Home.jsx          # Public landing page
│   │   │   ├── About.jsx         # Public about page
│   │   │   ├── Contact.jsx       # Public contact page
│   │   │   ├── ProductPage.jsx   # Public products page
│   │   │   ├── Login.jsx         # Login page
│   │   │   ├── Dashboard.jsx     # CRM dashboard
│   │   │   ├── Clients.jsx       # Client management
│   │   │   ├── ClientProfile.jsx # Single client detail view
│   │   │   ├── Leads.jsx         # Kanban lead pipeline
│   │   │   ├── Policies.jsx      # Policy management
│   │   │   ├── Claims.jsx        # Claims management
│   │   │   ├── Documents.jsx     # Document uploads (Cloudinary)
│   │   │   ├── Tasks.jsx         # Task management
│   │   │   ├── Commissions.jsx   # Commission tracking
│   │   │   ├── Quotations.jsx    # Quote management
│   │   │   ├── Reports.jsx       # Reports & analytics
│   │   │   ├── Messages.jsx      # Internal messaging
│   │   │   ├── Settings.jsx      # Company + user settings
│   │   │   └── More.jsx          # Additional features menu
│   │   └── components/
│   │       ├── Layout.jsx        # Main CRM layout wrapper
│   │       ├── Sidebar.jsx       # Navigation sidebar
│   │       ├── TopBar.jsx        # Top navigation bar
│   │       ├── PublicLayout.jsx  # Public pages layout
│   │       ├── PublicNav.jsx     # Public nav bar
│   │       ├── Footer.jsx        # Public footer
│   │       ├── TaskModal.jsx     # Task create/edit modal
│   │       ├── QuoteForm.jsx     # Public quote request form
│   │       ├── MotorDocsUpload.jsx   # Public motor docs upload
│   │       ├── MotorQuoteCalc.jsx    # Motor quote calculator
│   │       ├── MedicalComparator.jsx # Medical plan comparator
│   │       └── CustomSelect.jsx  # Custom styled select input
├── server/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── routes/
│   │   │   ├── auth.js           # POST /api/auth/login, /logout, /me
│   │   │   ├── clients.js        # CRUD /api/clients
│   │   │   ├── leads.js          # CRUD /api/leads (kanban pipeline)
│   │   │   ├── policies.js       # CRUD /api/policies
│   │   │   ├── claims.js         # CRUD /api/claims
│   │   │   ├── documents.js      # CRUD /api/documents (Cloudinary/local)
│   │   │   ├── tasks.js          # CRUD /api/tasks
│   │   │   ├── commissions.js    # CRUD /api/commissions
│   │   │   ├── quotations.js     # CRUD /api/quotations
│   │   │   ├── payments.js       # CRUD /api/payments
│   │   │   ├── reports.js        # GET /api/reports
│   │   │   ├── messages.js       # CRUD /api/messages
│   │   │   ├── notifications.js  # GET/PATCH /api/notifications
│   │   │   ├── dashboard.js      # GET /api/dashboard
│   │   │   ├── settings.js       # GET/PATCH /api/settings
│   │   │   ├── users.js          # CRUD /api/users (admin only)
│   │   │   ├── auditlog.js       # GET /api/audit
│   │   │   └── public.js         # /api/public/* (no auth required)
│   │   ├── middleware/
│   │   │   ├── auth.js           # JWT verification middleware
│   │   │   ├── security.js       # Rate limiter + security headers
│   │   │   └── audit.js          # Audit log middleware
│   │   └── utils/
│   │       ├── cloudinary.js     # Cloudinary upload/delete helpers
│   │       ├── email.js          # Nodemailer email helpers
│   │       └── renewalTasks.js   # Auto-create renewal tasks
│   ├── prisma/
│   │   ├── schema.prisma         # SQLite schema (local dev)
│   │   ├── schema.prod.prisma    # PostgreSQL schema (production)
│   │   ├── seed.js               # Local dev seed data
│   │   └── seed.prod.js          # Production seed (admin user only, safe to re-run)
│   ├── scripts/
│   │   └── cleanup-data.js       # Deletes all data except users
│   └── uploads/                  # Local file storage (dev only)
├── render.yaml                   # Render.com deployment config
└── CLAUDE.md                     # This file
```

---

## API Routes Summary

### Public (no auth) — `/api/public/`
- `POST /api/public/quote` — Submit quote request (sends email to admin)
- `POST /api/public/motor-docs` — Upload motor documents (Cloudinary)
- `GET  /api/public/settings` — Get company name/logo for public pages

### Auth — `/api/auth/`
- `POST /api/auth/login` — Login, returns JWT
- `GET  /api/auth/me` — Get current user from token

### CRM (JWT required)
| Route | Methods | Notes |
|---|---|---|
| `/api/clients` | GET, POST, PUT, DELETE | Client management |
| `/api/leads` | GET, POST, PUT, DELETE | Kanban pipeline |
| `/api/policies` | GET, POST, PUT, DELETE | Policy tracking |
| `/api/claims` | GET, POST, PUT, DELETE | Claims |
| `/api/documents` | GET, POST, DELETE | File uploads (Cloudinary in prod) |
| `/api/documents/:id/download` | GET | Redirect to Cloudinary URL or serve local file |
| `/api/tasks` | GET, POST, PUT, DELETE | Task management |
| `/api/commissions` | GET, POST, PUT, DELETE | Commission tracking |
| `/api/quotations` | GET, POST, PUT, DELETE | Quotes |
| `/api/payments` | GET, POST, PUT, DELETE | Payment records |
| `/api/reports` | GET | Analytics data |
| `/api/messages` | GET, POST, DELETE | Internal messages |
| `/api/notifications` | GET, PATCH | User notifications |
| `/api/dashboard` | GET | Summary stats |
| `/api/settings` | GET, PATCH | Company settings |
| `/api/users` | GET, POST, PUT, DELETE | User management (admin) |
| `/api/audit` | GET | Audit log (admin) |
| `/api/health` | GET | Health check (no auth) |

---

## Environment Variables

### Local (`server/.env`)
```
DATABASE_URL=file:./dev.db
JWT_SECRET=engishu-jwt-secret-change-in-production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=cover@engishu.com
SMTP_USER=
SMTP_PASS=
FRONTEND_URL=http://127.0.0.1:9348
PORT=9247
CLOUDINARY_CLOUD_NAME=dcsx5usn0
CLOUDINARY_API_KEY=442151891335163
CLOUDINARY_API_SECRET=<secret>
```

### Production (set in Render dashboard — NOT in render.yaml)
```
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://...  (Render internal URL)
JWT_SECRET=<auto-generated by Render>
ADMIN_EMAIL=cover@engishu.com
ADMIN_EMAIL_LOGIN=<admin login email>
ADMIN_PASSWORD=<admin login password>
SMTP_USER=<smtp email>
SMTP_PASS=<smtp password>
CLOUDINARY_CLOUD_NAME=dcsx5usn0
CLOUDINARY_API_KEY=442151891335163
CLOUDINARY_API_SECRET=<secret>
```

---

## Render Deployment

**Build Command** (set in Render dashboard):
```
cd client && npm install --include=dev && npm run build && cd ../server && npm install && cp prisma/schema.prod.prisma prisma/schema.prisma && npx prisma generate && npx prisma db push
```
- `client/.npmrc` has `include=dev` to ensure Vite devDeps are installed even with `NODE_ENV=production`
- `cp prisma/schema.prod.prisma prisma/schema.prisma` switches to PostgreSQL schema for build
- `prisma db push` (not `migrate deploy`) — pushes schema directly; SQLite migrations were deleted as they conflict with PostgreSQL

**Start Command** (set in Render dashboard):
```
cd server && node -e "require('./prisma/seed.prod.js')" ; node src/index.js
```
- Seed runs first, skips if users already exist
- `;` (not `&&`) so server starts even if seed fails

**Important Render notes:**
- Free tier sleeps after inactivity — first request takes 30–60 seconds (cold start)
- render.yaml is used for initial service creation only; subsequent changes must be made in the Render dashboard
- Static React build served by Express from `../../client/dist` in production

---

## Cloudinary Integration

File: `server/src/utils/cloudinary.js`

- Configured if all 3 env vars present: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Falls back to local disk storage if any env var is missing (local dev works without Cloudinary)
- `uploadToCloudinary(buffer, originalName, folder)` — streams buffer to Cloudinary
- `deleteFromCloudinary(publicId)` — tries both `image` and `raw` resource types
- `extractPublicId(url)` — extracts public_id from Cloudinary URL for deletion
- Documents route: if URL starts with `http`, redirects to Cloudinary; else serves local file

---

## Database

**Local dev:** SQLite at `server/prisma/dev.db`
**Production:** PostgreSQL on Render (Oregon region)

To clean all data (preserves users):
```bash
cd server && node scripts/cleanup-data.js
```

To add a local dev migration after schema change:
```bash
cd server && npx prisma migrate dev --name <name>
```

To push schema to production without migrations:
```bash
# Run via Render deploy or locally with production DATABASE_URL:
npx prisma db push
```

---

## Local Development

```bash
# Terminal 1 — backend
cd server && npm install && npm run dev
# Runs on http://127.0.0.1:9247

# Terminal 2 — frontend
cd client && npm install && npm run dev
# Runs on http://127.0.0.1:9348
```

---

## Key Design Decisions

- **Single service on Render:** Express serves the React build in production. No separate frontend hosting needed.
- **SQLite local / PostgreSQL production:** Two separate Prisma schema files. Build command copies prod schema before generating.
- **No migration history:** SQLite migrations were deleted as they conflicted with PostgreSQL. `prisma db push` is used instead.
- **Cloudinary fallback:** All file upload code checks `cloudinary.configured` flag and falls back to disk — local dev never needs Cloudinary credentials.
- **CORS:** Allows both `FRONTEND_URL` env var and `http://127.0.0.1:9348` (local dev).
- **Security:** Rate limiting (200 req/min global), security headers, JWT auth, audit logging on all mutations.
- **Mobile:** `overflow-x: hidden` on html+body, viewport `maximum-scale=1.0` prevents zoom-out on mobile. Leads kanban uses `flex overflow-x-auto` for horizontal scroll on small screens.
