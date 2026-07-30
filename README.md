# USA Number Reseller

Wallet-based virtual USA number purchasing platform with user wallets, payment adapters, vendor adapters, OTP polling, refunds, KYC, abuse controls, and admin operations.

## First Module Status

This repository currently contains the project setup and shared foundations:

- pnpm workspace and Turborepo configuration
- Next.js web app scaffold
- Express API scaffold
- Prisma schema and seed entrypoint
- Shared config, validation, types, UI primitives
- Mock vendor and payment adapter boundaries
- Docker Compose for PostgreSQL and Redis

## Local Setup

```bash
corepack enable
corepack pnpm install
cp .env.example .env
docker compose up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

## Project Commands

```bash
corepack pnpm dev
corepack pnpm build
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

## Health Checks

- `GET /api/health`
- `GET /api/health/database`
- `GET /api/health/redis`

The web app runs on `http://localhost:3000` and the API on `http://localhost:4000`.

## Seed Accounts

The seed script creates:

- Admin: `admin@example.com` / `AdminPass123!`
- User: `user@example.com` / `UserPass123!`

Do not use these credentials outside local development.
