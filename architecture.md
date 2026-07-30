# Architecture

## 1. Architecture Style

Use a modular monorepo with a separate Next.js frontend and Node.js API.

```text
Browser
  |
  v
Next.js Web App
  |
  v
Express API
  |------ PostgreSQL
  |------ Redis
  |------ JazzCash
  |------ Easypaisa
  |------ Vendor Number API
  |------ Vendor OTP API
```

## 2. Main Components

### Web Application

Responsibilities:
- Authentication UI
- Wallet UI
- Top-up flow
- Catalog browsing
- Single and bulk purchase UI
- OTP status display
- Orders and transaction history
- Admin dashboard

The web app must not contain financial or pricing authority. It sends user intent to the backend and displays backend results.

### API Application

Responsibilities:
- Authentication
- Authorization
- Wallet operations
- Payment processing
- Vendor integrations
- Pricing
- Orders
- Activations
- Refunds
- Admin operations
- Audit logging

### PostgreSQL

Stores:
- Users
- Wallets
- Ledger entries
- Payments
- Orders
- Activations
- Vendor products
- Pricing rules
- Audit logs
- KYC information

### Redis

Use Redis for:
- Rate limiting
- Idempotency records
- Distributed purchase locks
- OTP polling state
- Temporary payment state
- Short-lived catalog cache
- Session denylist when needed

### Vendor Adapter Layer

Each vendor must implement the same interface:

```ts
interface NumberVendorAdapter {
  getAvailability(input: AvailabilityInput): Promise<AvailabilityResult>;
  reserveNumber(input: ReserveNumberInput): Promise<ReserveNumberResult>;
  getOtp(input: GetOtpInput): Promise<GetOtpResult>;
  cancelActivation(input: CancelActivationInput): Promise<CancelResult>;
  getActivationStatus(input: StatusInput): Promise<StatusResult>;
}
```

### Payment Adapter Layer

```ts
interface PaymentGatewayAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyCallback(input: VerifyCallbackInput): Promise<VerifyCallbackResult>;
  getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult>;
  refundPayment?(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
```

## 3. Request Flow

### Registration

```text
User -> Web -> API -> PostgreSQL
```

### Top-up

```text
User -> Web -> API -> Payment Gateway
Payment Gateway -> API Callback
API -> Verify Signature
API -> PostgreSQL Transaction
API -> Wallet Ledger Credit
```

### Number Purchase

```text
User -> Web -> API
API -> Validate Initial Top-up
API -> Calculate Price
API -> Lock Wallet
API -> Vendor Reserve
API -> Create Order + Activation
API -> Debit Wallet Ledger
API -> Commit
```

### OTP Fetch

```text
Web -> API Activation Status
API -> Redis Cache
API -> Vendor OTP Endpoint
API -> Normalize Result
API -> Update Activation
API -> Web
```

## 4. Monorepo Structure

```text
root/
  apps/
    web/
      app/
      components/
      features/
      hooks/
      stores/
      lib/
    api/
      src/
        modules/
        middleware/
        infrastructure/
        integrations/
        jobs/
        common/
  packages/
    database/
    validation/
    types/
    config/
    ui/
  docs/
  package.json
  turbo.json
```

## 5. Backend Module Structure

```text
modules/
  auth/
  users/
  wallets/
  payments/
  catalog/
  pricing/
  orders/
  activations/
  vendors/
  admin/
  audit/
  kyc/
```

Each module may contain:

```text
controller.ts
service.ts
repository.ts
routes.ts
schema.ts
types.ts
errors.ts
```

## 6. Security Boundaries

### Frontend Boundary

Frontend may display:
- Public service information
- User wallet balance
- User-owned orders
- User-owned activations
- OTP after authorisation

Frontend must not receive:
- Vendor API key
- Raw vendor OTP URL
- Payment secret
- Internal markup logic
- Other users' information

### Backend Boundary

Backend must:
- Verify identity
- Verify ownership
- Validate request payload
- Recalculate totals
- Check KYC and limits
- Check blocked services
- Apply rate limits
- Write audit logs

## 7. Scaling Strategy

### Initial Stage

- One API deployment
- One PostgreSQL instance
- One Redis instance
- Background job worker
- Poll active OTP sessions every 5 to 10 seconds

### Growth Stage

- Multiple stateless API instances
- Dedicated worker service
- Redis-based distributed locks
- Queue system such as BullMQ
- Read replicas for reporting
- Vendor failover and routing

## 8. Background Jobs

Use BullMQ for:
- OTP polling
- Activation expiry
- Refund processing
- Payment reconciliation
- Vendor availability refresh
- Daily financial reconciliation
- Audit retention jobs

## 9. Failure Handling

### Vendor Timeout
- Mark request as pending only when reservation state is uncertain.
- Query vendor status before retrying.
- Never blindly reserve twice.

### Payment Callback Retry
- Use gateway transaction ID as an idempotency key.
- Return success for already processed callbacks.

### Bulk Partial Failure
- Create one order.
- Create one activation per requested number.
- Debit only successful activations.
- Mark failed lines separately.

### OTP Polling Failure
- Keep activation in waiting state.
- Apply backoff.
- Stop after expiry.
- Refund only under vendor policy.
