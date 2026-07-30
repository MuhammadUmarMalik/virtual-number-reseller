# System Design

## 1. System Context

The system connects four main parties:

```text
Customer
  |
  v
Reseller Platform
  |------ Payment Gateway
  |------ Number Vendor
  |------ OTP Vendor Endpoint
  |------ Admin and Support Team
```

## 2. High-Level Design

```text
[Next.js Web]
      |
      v
[API Gateway / Express API]
      |
      +-------------------+
      |                   |
      v                   v
[PostgreSQL]           [Redis]
      |
      +-------------------+-------------------+
      |                   |                   |
      v                   v                   v
[Payment Service]   [Vendor Service]    [Job Worker]
      |                   |                   |
      v                   v                   v
[JazzCash/Easypaisa] [Vendor API]       [OTP Polling]
```

## 3. Core Services

### Auth Service

Responsibilities:
- Registration
- Login
- Refresh token
- Password reset
- Verification
- Role checks
- Account status

### Wallet Service

Responsibilities:
- Balance read
- Credit
- Debit
- Refund
- Ledger
- Reconciliation

### Payment Service

Responsibilities:
- Create top-up
- Sign payment request
- Verify callback
- Deduplicate callbacks
- Credit wallet
- Reconcile gateway status

### Pricing Service

Responsibilities:
- Vendor cost lookup
- Markup calculation
- Bulk discounts
- Minimum profit
- Quote expiry

### Order Service

Responsibilities:
- Create order
- Single purchase
- Bulk purchase
- Partial success
- Totals
- Order status

### Activation Service

Responsibilities:
- Number ownership
- OTP status
- Expiry
- Cancellation
- Completion
- Refund eligibility

### Vendor Service

Responsibilities:
- Vendor adapter selection
- Availability
- Reservation
- OTP retrieval
- Cancellation
- Vendor health
- Failover

### Audit Service

Responsibilities:
- Admin actions
- Financial actions
- Security-sensitive events
- Before and after state

## 4. Sequence: Wallet Top-up

```text
User -> Web: Enter amount and choose gateway
Web -> API: Create top-up request
API -> DB: Create payment record
API -> Gateway: Create signed payment request
Gateway -> User: Payment page
Gateway -> API: Callback/webhook
API -> Gateway Adapter: Verify signature
API -> DB: Lock payment record
API -> DB: Check duplicate status
API -> Wallet Service: Credit wallet
Wallet Service -> DB: Lock wallet
Wallet Service -> DB: Add ledger credit
Wallet Service -> DB: Update balance
API -> DB: Mark payment successful
API -> Gateway: Acknowledge callback
```

## 5. Sequence: Single Number Purchase

```text
User -> Web: Select service and country
Web -> API: Request quote
API -> Pricing Service: Calculate price
API -> Web: Return quote
User -> Web: Confirm purchase
Web -> API: Create order with idempotency key
API -> DB: Start transaction and lock wallet
API -> Vendor Service: Reserve number
Vendor Service -> Vendor API: Purchase
Vendor API -> Vendor Service: phone|otpUrl
Vendor Service -> API: Normalized activation
API -> DB: Create order and activation
API -> DB: Add wallet debit
API -> DB: Update balance
API -> DB: Commit
API -> Web: Return activation
```

## 6. Sequence: OTP Retrieval

```text
Worker -> DB: Find active activations
Worker -> Vendor Service: Get OTP
Vendor Service -> Vendor API: Fetch OTP status
Vendor API -> Vendor Service: Response
Vendor Service -> Worker: Normalized status
Worker -> DB: Update activation
Worker -> Redis: Cache current status
Web -> API: Get activation status
API -> Redis/DB: Load status
API -> Web: Return owned activation status
```

## 7. Sequence: Bulk Purchase

```text
User -> API: Quantity N
API -> Pricing Service: Calculate quote
API -> Wallet Service: Confirm maximum available funds
API -> Vendor Service: Reserve numbers
Vendor Service -> API: N item results
API -> DB: Create order
API -> DB: Create activation rows
API -> Wallet Service: Debit successful total
API -> DB: Mark COMPLETED, PARTIAL, or FAILED
API -> User: Return item-level results
```

## 8. Idempotency Design

Required for:
- Payment creation
- Payment callback
- Order creation
- Vendor reservation
- Refund
- Admin wallet adjustment

Store:

```text
idempotencyKey
operationType
requestHash
status
responseBody
expiresAt
```

When the same key and same request arrive:
- Return the original result.

When the same key and different request arrive:
- Reject with conflict.

## 9. Wallet Consistency

Use pessimistic locking.

```text
BEGIN
SELECT wallet FOR UPDATE
CHECK balance
INSERT ledger
UPDATE wallet
COMMIT
```

Rules:
- One ledger entry per financial operation.
- Balance must never be negative.
- Refund must reference the original charge.
- Admin adjustment requires reason and audit log.

## 10. Availability and Failover

### Vendor Health

Track:
- Success rate
- Average response time
- Timeout rate
- OTP success rate
- Refund rate
- Last successful request

### Vendor Routing

Choose vendor by:
1. Service availability
2. Country availability
3. Active status
4. Priority
5. Cost
6. Health score

Do not automatically fail over after an uncertain reservation. First check the original vendor transaction state.

## 11. Caching

Cache:
- Countries
- Services
- Vendor availability
- Quotes for a short period
- Activation status

Do not cache:
- Authoritative wallet writes
- Final payment state without persistence
- Sensitive OTP values for long periods

## 12. Rate Limits

Suggested limits:

```text
Login: 5 attempts per 15 minutes
Register: 3 per hour per IP
Quote: 60 per minute per user
Purchase: 10 per minute per user
Activation status: 12 per minute per activation
Admin wallet adjustment: 20 per hour per admin
```

Adjust after observing real usage.

## 13. Observability

Track:
- Request ID
- User ID
- Payment reference
- Order number
- Activation ID
- Vendor response time
- Queue lag
- Callback failures
- Wallet reconciliation mismatch

Metrics:
- Payment success rate
- Number reservation success rate
- OTP success rate
- Refund rate
- Gross margin
- Vendor uptime

## 14. Security

- Encrypt vendor secrets.
- Encrypt OTP endpoints.
- Limit OTP access to owner.
- Redact OTPs from logs.
- Verify payment signatures.
- Apply replay protection.
- Add KYC thresholds.
- Block suspicious bulk orders.
- Add admin MFA.
- Record all financial admin actions.

## 15. Deployment Topology

### MVP

```text
Vercel: Next.js web
Container host: Express API
Container host: BullMQ worker
Managed PostgreSQL
Managed Redis
Object storage for non-sensitive documents
```

### Production Growth

```text
Load balancer
Multiple API instances
Multiple workers
Managed PostgreSQL with replicas
Managed Redis cluster
Central logging
Error monitoring
Secrets manager
Daily backups
```

## 16. Recovery Plan

- Daily PostgreSQL backups
- Point-in-time recovery when available
- Redis treated as disposable cache
- Payment reconciliation command
- Wallet reconciliation command
- Vendor activation reconciliation job
- Audit logs for manual corrections

## 17. Key Risks

- Vendor API instability
- Duplicate payment callbacks
- Duplicate vendor reservations
- Wallet race conditions
- Fraudulent top-ups
- OTP misuse
- Bulk purchase abuse
- Vendor price changes
- Refund disputes

Mitigation must be part of the core design, not added later.
