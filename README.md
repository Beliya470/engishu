# Engishu Insurance Agency

Insurance agency web application and internal staff portal.

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** SQLite (dev), PostgreSQL (production)

## Setup

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cd server && cp .env.example .env
# Edit .env with your values

# Database
cd server
npx prisma migrate dev
node prisma/seed.js

# Run
cd server && npm run dev       # backend
cd client && npm run dev       # frontend
```

## Environment Variables

See `server/.env.example` for required variables.

## Deployment

See `render.yaml` for Render.com deployment configuration.
