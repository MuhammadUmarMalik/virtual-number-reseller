# CLAUDE.md

## Project Overview

Build a production-ready virtual USA number resale and OTP delivery platform. The application lets users add wallet balance, buy one or multiple numbers, receive OTPs through the platform, and view complete order and wallet history.

The platform must support lawful, authorised, and compliant use cases only. Add clear abuse prevention, purchase limits, KYC controls, audit logs, and blocked-service rules.

## Tech Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand for local client state
- TanStack Query for server state
- React Hook Form
- Zod validation

### Backend
- Node.js
- Express.js
- TypeScript
- Zod
- Prisma ORM
- PostgreSQL
- Redis for caching, rate limiting, OTP polling state, and distributed locks
- JWT access and refresh tokens

### Payments
- JazzCash merchant gateway
- Easypaisa merchant gateway
- Internal wallet ledger
- Minimum first top-up: PKR 500

## Main Business Flow

1. User registers and verifies account.
2. New wallet starts at PKR 0.
3. User must complete an initial top-up of at least PKR 500.
4. User selects service, country, and quantity.
5. Backend calculates price from vendor cost and admin markup.
6. Backend locks wallet balance and validates funds.
7. Backend requests number from vendor.
8. Vendor may return:

```text
14633023941|https://vendor.example.com/sms/facebook/activation-id
```

9. Backend parses and encrypts the vendor OTP endpoint.
10. Backend creates activation records.
11. Wallet balance is deducted after successful reservation.
12. Frontend polls the backend for OTP updates.
13. Backend polls the vendor endpoint and returns OTP status.
14. Failed or refundable activations create wallet refunds.

## Core Rules

- Never trust prices, balances, payment states, service IDs, or totals from the frontend.
- Never expose vendor credentials or vendor OTP URLs to users.
- Never change wallet balance without an immutable ledger record.
- Never credit top-up from a browser redirect alone.
- Credit wallet only after verified gateway callback or webhook.
- Use idempotency keys for payments, purchases, refunds, and retries.
- Use database transactions and row locking for wallet operations.
- Store order price snapshots so later pricing changes do not affect old orders.
- Bulk orders may partially succeed.
- Refund only failed quantities.
- Encrypt API keys, OTP URLs, and sensitive metadata.
- Do not log OTP values, tokens, passwords, or gateway secrets.

## Required Modules

### User
- Registration
- Login
- Refresh token
- Logout
- Email or phone verification
- Profile
- KYC status
- Account suspension

### Wallet
- Balance
- First top-up enforcement
- Wallet transaction history
- Refunds
- Admin credit/debit adjustment
- Reconciliation

### Payment
- JazzCash adapter
- Easypaisa adapter
- Payment initiation
- Callback verification
- Webhook verification
- Payment status polling
- Duplicate callback protection

### Catalog
- Countries
- Services
- Vendor products
- Availability
- Dynamic pricing
- Bulk pricing

### Number Purchase
- Single purchase
- Bulk purchase
- Partial success
- Activation expiry
- Cancellation
- Refund
- Retry-safe vendor calls

### OTP
- Waiting state
- Polling
- OTP received
- Expiry
- Completion
- Copy number
- Copy OTP

### Admin
- Users
- KYC
- Wallets
- Payments
- Orders
- Activations
- Vendors
- Pricing
- Services
- Countries
- Reports
- Audit logs
- Abuse controls

## Activation Statuses

```text
RESERVED
WAITING_FOR_OTP
OTP_RECEIVED
COMPLETED
EXPIRED
CANCELLED
REFUNDED
FAILED
```

## Coding Standards

- Use strict TypeScript.
- Avoid `any`.
- Keep controllers thin.
- Put business logic in services.
- Put database access in repositories where useful.
- Validate all request inputs with Zod.
- Return structured API errors.
- Use environment variables for secrets.
- Add unit tests for pricing, wallet, payments, and refunds.
- Add integration tests for payment callbacks and purchase flow.
- Add end-to-end tests for registration, top-up, purchase, and OTP retrieval.
- Use linting and formatting.
- Add request IDs and structured logs.

## Suggested Folder Structure

```text
apps/
  web/
  api/
packages/
  config/
  database/
  types/
  validation/
  ui/
  vendor-sdk/
  payment-sdk/
```

## Environment Variables

```text
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ENCRYPTION_KEY=
APP_URL=
API_URL=
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=
JAZZCASH_CALLBACK_URL=
EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
EASYPAISA_CALLBACK_URL=
VENDOR_BASE_URL=
VENDOR_API_KEY=
```

## Definition of Done

A feature is complete only when:
- Request validation exists.
- Permission checks exist.
- Business rules are enforced on the backend.
- Database transaction handling is correct.
- Errors are user-readable.
- Audit logs exist for financial and admin operations.
- Tests cover success and failure cases.
- Sensitive data is not exposed.
