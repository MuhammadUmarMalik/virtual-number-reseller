# Implementation Instructions

## 1. Build Order

Implement the project in this order:

1. Monorepo setup
2. Database and Prisma
3. Authentication
4. User and wallet creation
5. Wallet ledger
6. Payment adapters
7. Payment callback processing
8. Catalog and pricing
9. Vendor adapter
10. Single purchase
11. Bulk purchase
12. OTP polling
13. Refund handling
14. Admin dashboard
15. KYC and abuse controls
16. Reports
17. Tests
18. Deployment

## 2. Project Setup

Recommended stack:

```text
pnpm
Turborepo
Next.js
Express.js
PostgreSQL
Prisma
Redis
BullMQ
```

Recommended commands:

```bash
pnpm init
pnpm add -D turbo typescript eslint prettier
```

Create:

```text
apps/web
apps/api
packages/database
packages/types
packages/validation
packages/config
```

## 3. Environment Handling

- Add `.env.example`.
- Never commit `.env`.
- Validate environment variables at startup with Zod.
- Stop the app when required secrets are missing.

## 4. Authentication

- Hash passwords with Argon2id.
- Issue short-lived access tokens.
- Store refresh tokens as hashes.
- Rotate refresh tokens.
- Revoke tokens on logout.
- Add role middleware.
- Add account status middleware.

## 5. Wallet Rules

- Create wallet during registration.
- Never update balance outside wallet service.
- Wrap each balance change in a database transaction.
- Lock wallet row before changing balance.
- Require idempotency key.
- Store balance before and after.
- Add reconciliation command.

## 6. First Top-up Rule

```text
if initialTopupDone is false:
  required minimum = PKR 500
else:
  required minimum = admin-configured amount
```

Set `initialTopupDone = true` only after a verified successful payment callback.

## 7. Payment Integration

Create adapters:

```text
JazzCashPaymentAdapter
EasypaisaPaymentAdapter
```

For each gateway:
- Create merchant transaction reference.
- Save payment before redirect.
- Sign request on backend.
- Verify callback signature on backend.
- Compare amount and merchant reference.
- Ignore duplicate callbacks.
- Credit wallet once.
- Save redacted callback details.

Do not credit wallet from:
- Frontend success page
- Query string alone
- Unverified callback
- Manual browser refresh

## 8. Pricing

Pricing function must be deterministic and covered by tests.

Example:

```ts
sellingPrice = max(
  fixedPrice,
  vendorCost + fixedMargin + vendorCost * percentageMargin,
  vendorCost + minimumProfit
);
```

Apply bulk discount after base selling price.

Store snapshots in each activation:
- Vendor cost
- Selling price
- Discount
- Final charged amount

## 9. Vendor Integration

Create one adapter per vendor.

Parse response safely:

```ts
const parts = response.trim().split("|");

if (parts.length !== 2) {
  throw new VendorResponseError("Invalid vendor response format");
}
```

Validate:
- Phone number format
- OTP endpoint URL
- Allowed hostname
- HTTPS
- Activation ID when available

Encrypt OTP endpoint before storage.

## 10. Single Purchase Algorithm

```text
1. Validate request.
2. Check user status.
3. Check initial top-up status.
4. Calculate price.
5. Start DB transaction.
6. Lock wallet.
7. Check balance.
8. Create pending order.
9. Call vendor using idempotency reference.
10. Create activation.
11. Create wallet debit ledger.
12. Update wallet balance.
13. Mark order complete.
14. Commit.
```

When vendor state is uncertain, do not retry blindly. Query vendor status first.

## 11. Bulk Purchase Algorithm

```text
1. Validate quantity and limits.
2. Calculate per-item price and total maximum charge.
3. Reserve numbers one by one or using vendor bulk endpoint.
4. Record success or failure for each item.
5. Debit only successful items.
6. Set order status:
   - COMPLETED when all succeed
   - PARTIAL when some succeed
   - FAILED when none succeed
```

## 12. OTP Polling

- Poll only active activations.
- Use BullMQ worker.
- Use 5 to 10 second intervals.
- Apply exponential backoff on vendor errors.
- Stop at expiry.
- Cache latest state in Redis.
- Persist meaningful status changes in PostgreSQL.
- Do not write OTP values to logs.

## 13. Refunds

Refund flow:

```text
1. Confirm activation is refundable.
2. Create refund with idempotency key.
3. Lock wallet.
4. Create wallet credit ledger.
5. Update wallet balance.
6. Mark activation REFUNDED.
7. Mark refund COMPLETED.
```

## 14. API Error Format

Use one format:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Your wallet balance is too low.",
    "details": null,
    "requestId": "req_123"
  }
}
```

## 15. Frontend State

Use Zustand only for:
- Auth session UI state
- Filters
- Purchase draft
- Modal state

Use TanStack Query for:
- Wallet
- Catalog
- Quotes
- Orders
- Activations
- Payments

Do not duplicate server state inside Zustand.

## 16. Security Checklist

- CSRF protection where needed
- Secure cookies
- CORS allowlist
- Helmet headers
- Rate limiting
- Input validation
- SQL injection protection through Prisma
- Output filtering
- Ownership checks
- Admin audit logs
- Secret encryption
- Log redaction
- Webhook signature checks
- Replay protection
- OTP expiry
- KYC and abuse limits

## 17. Testing

### Unit Tests
- Pricing
- Initial top-up rule
- Wallet debit
- Wallet credit
- Refund calculation
- Vendor response parser

### Integration Tests
- Payment callback
- Duplicate callback
- Single purchase
- Bulk partial purchase
- Refund
- Activation ownership

### End-to-End Tests
- Register
- Top-up
- Buy number
- Receive OTP
- View transaction history

## 18. Deployment

Recommended:
- Web: Vercel
- API: Railway, Render, Fly.io, or VPS
- PostgreSQL: managed PostgreSQL
- Redis: managed Redis
- Worker: separate API worker process

Required production controls:
- HTTPS
- Domain validation
- Error monitoring
- Uptime monitoring
- Daily database backups
- Payment reconciliation
- Vendor health checks
