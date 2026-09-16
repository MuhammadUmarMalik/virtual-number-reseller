# Virtual Number Reseller

A web application for reselling virtual (USA) phone numbers. Users buy numbers, receive OTPs, top up their wallet, and manage their numbers — with an admin panel for inventory, orders, top-ups and refunds.

## Overview

* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, ShadCN UI, Zustand, TanStack Query, Zod, React Hook Form
* **Backend:** Node.js, Express, TypeScript
* **Database:** PostgreSQL with Prisma ORM
* **Architecture:** MVC (`Route → Middleware → Controller → Service → Repository → Prisma`)

## Features

* Authentication with access/refresh tokens and persistent sessions
* Product catalog and number purchase flow with wallet debits
* Wallet with transaction history, deposits (top-ups) and refunds
* Top-up requests via payment accounts and WhatsApp confirmation, admin approval
* OTP retrieval and OTP history for purchased numbers
* Multi-currency price display with a scheduled exchange-rate sync (prices stored in PKR)
* SMSBower vendor integration for live number inventory and catalog
* Admin panel: users, top-ups, payment accounts, products, inventory, orders, refunds, announcements, settings

## Project Structure

```text
backend/            Express + Prisma API (MVC)
  src/
    controllers/    Request handling
    services/       Business logic
    repositories/   Prisma queries
    routes/         Route definitions
    middlewares/    Auth, validation, error handling
    jobs/           Background jobs (OTP polling, stock sync, exchange rates)
    integrations/   Vendor clients
  prisma/
    schema.prisma
    migrations/
    seed.ts
frontend/           Next.js App Router client
docs/               API and database documentation
```

## Requirements

* Node.js >= 20.19.0
* PostgreSQL 14+

## Installation

```bash
# Backend
cd backend
npm install
cp .env.example .env   # then fill in your values
npx prisma migrate dev
npm run prisma:seed    # creates an admin demo user (dev only)

# Frontend
cd frontend
npm install
cp .env.example .env.local
```

## Environment Variables

Backend (see `backend/.env.example`):

```text
NODE_ENV         # development | production
PORT             # API port (default 4000)
DATABASE_URL     # PostgreSQL connection string
ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET
ACCESS_TOKEN_EXPIRY / REFRESH_TOKEN_EXPIRY_DAYS
CORS_ORIGIN      # approved frontend origin
JWT_ISSUER
SMSBOWER_API_KEY # vendor API key (server only, never exposed to the client)
SMSBOWER_BASE_URL
VENDOR_SYNC_INTERVAL_MS
EXCHANGE_RATE_SYNC_INTERVAL_MS
```

Frontend (see `frontend/.env.example`):

```text
NEXT_PUBLIC_API_BASE_URL   # e.g. http://localhost:4000/api/v1
```

## Running Locally

```bash
# Backend (http://localhost:4000)
cd backend && npm run dev

# Frontend (http://localhost:3000)
cd frontend && npm run dev
```

## Testing

```bash
cd backend && npm test        # vitest
cd backend && npm run lint    # eslint
cd backend && npm run type-check
cd frontend && npm run lint
cd frontend && npm run type-check
```

## Build

```bash
cd backend && npm run build
cd frontend && npm run build
```

## Deployment

* Apply database migrations with `npx prisma migrate deploy`.
* Run background jobs by starting the backend process (`jobs/index.ts` starts on boot).
* Set `NODE_ENV=production` and real secrets in the environment.
* Never configure vendor keys or secrets in frontend environment variables.

## Contributing

Follow the branch strategy in `docs/` / the project `CLAUDE.md`: feature work on `feature/*` branches merging through `develop` into `main`. Keep commits small and use Conventional Commits.

## License

Not specified.