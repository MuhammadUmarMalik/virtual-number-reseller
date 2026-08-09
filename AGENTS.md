# AGENTS.md

## Repo state (critical)

This is a design/spec repo right now. **All source files are empty stubs (0 bytes)**: every `backend/src/**`, `frontend/src/**`, `package.json`, `tsconfig.json`, `schema.prisma`, `docker-compose.yml`, `README.md`. There are no installed dependencies, no defined npm scripts, no CI, no lint/test/typecheck config. Do not claim any build, lint, or test command passes — none exist to run.

The only real content is:
- `claude.md` — the authoritative project rules (gitignored but committed). Follow it. It defines the MVC flow, wallet/order/top-up/refund/OTP rules, security, and response format.
- `docs/` — the actual design specs. Treat as source of truth for what to build:
  - `docs/database.md` — full Prisma schema design (tables, enums, relations, money rules)
  - `docs/api-endpoints.md` — complete REST API surface under `/api/v1`
  - `docs/architecture.md` — stack, backend MVC flow, frontend structure
  - `docs/user-flow.md` — business flows end to end
- `git.md` — branch workflow (see below)

## Git workflow

- Feature branches are lowercase hyphenated, cut from `develop` (`feature/<name>`), one feature per branch.
- Never merge `feature/*` directly into `main`. Never force-push shared branches.
- Many `feature/*` branches already exist locally and on `origin` — check `git branch -a` before creating.
- `git.md` describes the exact branch loop to follow when asked.

## Stack & architecture

- Next.js App Router frontend (`frontend/`), Express + Prisma + PostgreSQL backend (`backend/`), TypeScript both sides. No microservices.
- Backend request flow is strict: Route → Middleware → Controller → Service → Repository → Prisma → Postgres. Routes/controllers stay thin; business rules live in services; only Prisma queries in repositories.
- Frontend: API calls go in `frontend/src/services/*.service.ts`; Zustand only for shared client state; Zod for validation.
- Money is `Decimal`, never float. Wallet balance changes require a wallet-transaction record and a DB transaction; never delete financial records. Vendor costs/keys never exposed to users.

## Response format

API responses use `{ success, message, data }`; errors use `{ success, message, errors }`. Report task results to the user as: files changed, main changes, validation result, blockers.
