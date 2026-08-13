# SMSBower Implementation Handoff

## Status: Complete — All checks pass

**Branch:** `feature/smsbower-integration` (cut from `origin/develop`)
**Validation:** type-check ✓ | lint ✓ | tests ✓ (32 passed)

## What Was Built

### 1. Vendor Abstraction Layer

```
backend/src/integrations/vendor/
├── vendor.interface.ts      ← NumberVendor interface (the contract)
├── vendor.factory.ts        ← resolveVendor() factory
├── vendor.types.ts          ← shared types + Durian types (preserved)
├── durian/
│   └── durian.mapper.ts     ← DurianVendor implements NumberVendor
├── smsbower/
│   ├── smsbower.types.ts    ← SMSBower-specific types & constants
│   ├── smsbower.client.ts   ← HTTP client for SMSBower API
│   ├── smsbower.mapper.ts   ← SmsBowerVendor implements NumberVendor
│   └── smsbower.mapper.test.ts
├── vendor.client.ts         ← UNCHANGED (Durian HTTP client)
└── vendor.mapper.ts         ← UNCHANGED (Durian response mapper)
```

### 2. Schema Changes (Prisma)

**New enum:** `Vendor { DURIAN_RCS, SMSBOWER }`

**New columns:**
- `Product.vendor` (default DURIAN_RCS)
- `Order.vendor`, `Order.vendorActivationId`
- `PurchasedNumber.vendor`, `vendorActivationId`, `vendorCost`, `vendorOperator`, `canGetAnotherMs`

**Migration:** `backend/prisma/migrations/20260810000000_add_vendor_enum_and_columns/`

### 3. Webhook Endpoint

```
POST /api/webhooks/smsbower
```

- No auth (IP-whitelisted: `167.235.198.205`)
- Returns 200 immediately, processes async
- Deduplicates via `messageHash` (same as polling)
- Emits `otp.received` via SSE

### 4. Services Updated

| File | Change |
|---|---|
| `config/env.ts` | Added `smsbowerApiKey`, `smsbowerBaseUrl`, `smsbowerWebhookEnabled` |
| `services/vendor.service.ts` | Added `vendorRouter`, `getVendorBalance` |
| `services/vendor-router.service.ts` | NEW — `vendorRouter.purchase()`, `checkAvailability()` |
| `services/number.service.ts` | Added `processWebhookOtp()`, multi-vendor polling |
| `services/order.service.ts` | Added `purchaseWithSmsBower()` path |
| `repositories/order.repository.ts` | `createWithItems` accepts `vendor`, `vendorActivationId` |
| `repositories/number.repository.ts` | `listExpired` and `listForOtpPolling` include new fields |
| `controllers/smsbower-webhook.controller.ts` | NEW |
| `routes/smsbower-webhook.routes.ts` | NEW |
| `app.ts` | Mounts `/api/webhooks` before `/api/v1` |
| `jobs/expire-numbers.job.ts` | Handles SMSBower cancellation via vendor abstraction |
| `.env.example` | Added SMSBower vars |

## Design Principles

1. **Vendor-specific code stays in vendor adapters** — business logic in services is vendor-agnostic
2. **Durian backward-compatible** — all existing Durian code paths unchanged, default vendor is DURIAN_RCS
3. **SMSBower uses webhook-primary + polling-fallback** — webhook for realtime, `getStatus` for reconciliation
4. **Purchase routing** — `order.createOrder` checks `product.vendor` and dispatches to the correct path

## Key Interfaces

```ts
interface NumberVendor {
  readonly name: string;
  getBalance(): Promise<VendorBalance>;
  getServices(): Promise<VendorService[]>;
  getCountries(): Promise<VendorCountry[]>;
  getAvailability(params): Promise<VendorAvailability[]>;
  purchaseNumber(params: VendorPurchaseParams): Promise<VendorActivation>;
  getActivationStatus(activation): Promise<VendorActivationStatus>;
  cancelActivation(activation): Promise<VendorActionResult>;
  requestAnotherSms(activation): Promise<VendorActionResult>;
  completeActivation(activation): Promise<VendorActionResult>;
}
```

## What Remains (Not in This Scope)

1. **Frontend changes** — no frontend changes yet (vendor selection is backend-driven)
2. **Admin vendor management UI** — not built
3. **SMSBower catalog sync jobs** — `getServices`, `getCountries`, `getPricesV3` endpoints exist but no cron job yet
4. **Vendor routing optimization** — currently uses `product.vendor` directly, no fallback logic yet
5. **Database migration application** — migration file created but not applied to any DB
6. **Durian adapter cleanup** — `getServices`/`getCountries` return empty arrays (Durian doesn't expose these)

## Environment Variables to Configure

```env
SMSBOWER_API_KEY=your-smsbower-api-key
SMSBOWER_BASE_URL=https://smsbower.page
SMSBOWER_WEBHOOK_ENABLED=true
```

## Running the Migration

```bash
cd backend
npx prisma migrate dev --name add_vendor_enum_and_columns
```

## Verification Commands

```bash
cd backend
npm run type-check  # ✓ passes
npm run lint        # ✓ passes
npm run test        # ✓ 32 tests pass
```
