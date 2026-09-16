# SMSBower Activation Integration — Design & Plan

Status: **Draft — SMSBower API research pending** (official docs = source of truth).

## 1. Goal

Add the full SMSBower activation flow to the existing reseller app:

- Purchase numbers from SMSBower (`getNumber` / `getNumberV2`).
- Track activation status (`getStatus`) for activation IDs.
- Request code resend / cancel activation (`setStatus`) — owner + admin.
- Receive OTP/SMS via the documented SMSBower forwarding/webhook mechanism where available; **polling fallback** for active activations otherwise.
- Admin number list (search, pagination, country/service/status/otp-status/date/product filters) + detailed activation view.
- All provider communication server-side. SMSBower API key never leaves the backend.

## 2. Current state (verified)

- MVC backend (`routes → middlewares → controllers → services → repositories → prisma`).
- `backend/src/integrations/vendor/smsbower/smsbower.client.ts` — **catalog only**: `getBalance`, `getServices`, `getCountries`, `getTopCountriesByService`, `getPricesV3`. Base URL: `${SMSBOWER_BASE_URL}/stubs/handler_api.php` (default `https://smsbower.page`). Plain-text handler API; errors `BAD_KEY`, `BAD_ACTION`, `BAD_SERVICE`, `WRONG_SERVICE`, `BAD_COUNTRY`, `NO_ACTIVATION`, `NO_NUMBERS`, `NO_BALANCE`, `BAD_STATUS`, `EARLY_CANCEL_DENIED`.
- Purchases today go through **Durian RCS** (`vendor.client.ts` via `order.service.ts`). SMSBower is used for catalog/browsing only.
- `Order.vendorActivationId`, `PurchasedNumber.vendorActivationId` already exist (unused by Durian flow).
- `PurchasedNumber.status` enum: `WAITING ACTIVE RECEIVED EXPIRED REFUNDED DISABLED`.
- `OtpMessage` stores `rawMessage`, `otpCode`, `vendorMessageId`, `messageHash` (unique, dedup), `receivedAt`, `service`.
- User number routes: `GET /numbers`, `POST /numbers/:id/check-otp`, `GET /numbers/:id/otp`. Admin: `GET/PATCH/DELETE /admin/numbers`.
- Jobs: `otp-polling` (Durian `serial`-based), `expire-numbers`, `vendor-sync`, `sync-exchange-rates`.
- `.env.example` already lists `SMSBOWER_API_KEY`, `SMSBOWER_WEBHOOK_ENABLED`.

## 3. Research (PENDING — must confirm before implementing the client/webhook)

The SMSBower research subagent will confirm from official docs:

- `getNumber`/`getNumberV2` params + response (`ACCESS_ACTIVATION:<id>:<number>`?).
- `getStatus` response statuses: `STATUS_WAIT_CODE`, `STATUS_WAIT_RETRY`, `STATUS_CANCEL`, `STATUS_OK:<code>`, others.
- `setStatus` status values (2=cancel → `ACCESS_CANCEL`, 3=resend → `ACCESS_RETRY_GET`, 8=finish, 1/6 variants).
- **Webhook/forwarding**: does the official API forward SMS to a URL? Method, auth, body JSON, config. If NOT documented → polling only.
- Operator/provider/expiry: what the API officially exposes. **Never fabricate an expiry** — `PurchasedNumber.expiresAt` stays an **application-calculated** expiry; clearly separated from provider data.

## 4. Database changes (proposed — `PurchasedNumber` extension)

Reuse the existing `PurchasedNumber` + `OtpMessage` models. No duplicate tables.

Add to `PurchasedNumber` (all nullable, no invented provider data):

| Column | Type | Source |
| --- | --- | --- |
| `activationStatus` | String? | SMSBower `getStatus` raw status (verbatim) |
| `provider` | String? | snapshot of `product.vendorProviderId` when set |
| `service` | String? | snapshot of `product.service` |
| `country` | String? | snapshot of `product.country` |
| `countryCode` | String? | snapshot of `product.countryCode` |
| `sellingPrice` | Decimal? | snapshot of `product.sellingPrice` (app) |
| `currency` | String? | snapshot of `product.currency` (app) |
| `activationStartedAt` | DateTime? | recorded when activation assigned |
| `activationCompletedAt` | DateTime? | recorded when OTP received / completed |
| `cancelledAt` | DateTime? | recorded on cancel |

`expiresAt` (existing) = **application-calculated** expiry only.

`NumberStatus`: add `CANCELLED`. Map provider states → app status:

- `STATUS_WAIT_CODE` / `STATUS_WAIT_RETRY` → `ACTIVE` (waiting for OTP; `otpStatus` shows retry).

- `STATUS_OK` → `RECEIVED` (store OTP via OtpMessage), `activationCompletedAt` set.

- `NO_ACTIVATION` / cancel → `CANCELLED` (+ `cancelledAt`).

- app expiry → `EXPIRED` (existing job).

- refund → `REFUNDED` (existing).

## 5. API surface (adapts existing conventions)

User (auth):

- `GET /numbers` — extend: activation fields + filters.
- `GET /numbers/:id` — NEW: full activation details (owner only).
- `POST /numbers/:id/check-otp` — existing; works for SMSBower activations.
- `GET /numbers/:id/otp` — existing.
- `POST /numbers/:id/cancel` — NEW (setStatus 2), owner only.
- `POST /numbers/:id/retry` — NEW (setStatus 3), owner only.

Admin (auth + admin role):

- `GET /admin/numbers` — extend filters: search, status, country, service, otpStatus, dateFrom/dateTo, productId.
- `GET /admin/numbers/:id` — full details incl. OTP/SMS messages.
- `POST /admin/numbers/:id/cancel`, `POST /admin/numbers/:id/retry`, `POST /admin/numbers/:id/refresh-status`.

Webhook (public, validated):

- `POST /api/v1/webhooks/smsbower` — receive forwarded SMS, validate per documented mechanism, locate activation by `activationId`, store SMS+OTP+`receivedAt`, dedup via `messageHash`/vendor message id, update status, return 200.

## 6. Backend structure (follows existing layers)

- `integrations/vendor/smsbower/smsbower.client.ts` — add `getNumber`, `getNumberV2`, `getStatus`, `setStatus` (+ types).
- `integrations/vendor/smsbower/smsbower.types.ts` — add activation/status/error types.
- `services/smsbower-activation.service.ts` — orchestration: `purchase`, `refreshStatus`, `cancel`, `retry`, `processWebhook`.
- `controllers/smsbower-webhook.controller.ts`, `routes/smsbower-webhook.routes.ts` (+ mount in `routes/index.ts`).
- Extend `number.service.ts` / `otp-proxy.service.ts` / `number.repository.ts` for SMSBower activations.
- Extend `jobs/otp-polling.job.ts` to poll SMSBower activations via `getStatus` (active only, controlled interval, stop on terminal state).
- `admin.service.ts` / `admin.controller.ts` for admin endpoints.

## 7. Frontend

- Admin numbers page: new columns (Country, Service, Operator, Provider, Cost, Selling Price, OTP, SMS received, Activation time, Expiry) + filters + detail view (activation ID, status lifecycle, OTP/SMS, timestamps) + cancel/retry.
- User active-numbers page: activation status/OTP display, cancel/retry actions, lifecycle states (loading/empty/expired/cancelled/completed).
- Services + types updated; no provider keys/URLs in frontend.

## 8. Testing (Vitest, mocks only — no real SMSBower calls)

- Client: getNumber/getNumberV2/getStatus/setStatus parsing + error mapping.
- Webhook: valid, invalid, duplicate, unknown activation, malformed payload.
- OTP: pending, received, retry, cancelled, expired.
- Security: unauthorized, wrong-owner, invalid id, rate limit, provider/API-key exposure.

## 9. Security controls

- API key server-side only; never returned.
- Webhook validated (documented auth/source check); malformed → 400; unknown activation → 404; dedup (unique message hash).
- Ownership checks on all user number endpoints; IDOR prevention.
- Rate limiting on OTP/cancel/retry endpoints.
- Input validation on all params.
- Never log OTPs/keys/full SMS; log `activationId`, `numberId`, `service`, `country`, status, timestamp, error category.

## 10. Steps

1. Research (pending classifier).
2. DB migration (`PurchasedNumber` fields + `CANCELLED` status) + `prisma validate`.
3. Backend client/service/webhook/routes.
4. Jobs update.
5. Frontend admin + user UI.
6. Tests.
7. Security review, code review, lint/type-check/build.
8. Docs + README + CHANGELOG.