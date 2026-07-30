# Database Design

## 1. Database Choice

Use PostgreSQL with Prisma ORM.

Reasons:
- Strong transaction support
- Row locking for wallet operations
- Reliable financial ledger storage
- Good indexing and reporting
- JSON support for vendor metadata

## 2. Main Entities

### User

```text
id                  UUID primary key
name                string
email               string unique
phone               string unique nullable
passwordHash        string
role                USER | SUPPORT | ADMIN
status              ACTIVE | SUSPENDED | BLOCKED
emailVerifiedAt     timestamp nullable
phoneVerifiedAt     timestamp nullable
initialTopupDone    boolean default false
kycStatus           NOT_STARTED | PENDING | VERIFIED | REJECTED
createdAt           timestamp
updatedAt           timestamp
```

### RefreshToken

```text
id
userId
hashedToken
expiresAt
revokedAt
createdAt
```

### Wallet

```text
id
userId unique
balance Decimal(18,2)
currency string default PKR
version integer default 0
createdAt
updatedAt
```

### WalletTransaction

```text
id
walletId
type TOP_UP | PURCHASE | REFUND | ADMIN_CREDIT | ADMIN_DEBIT | REVERSAL
amount Decimal(18,2)
direction CREDIT | DEBIT
balanceBefore Decimal(18,2)
balanceAfter Decimal(18,2)
status PENDING | COMPLETED | FAILED | REVERSED
referenceType
referenceId
idempotencyKey unique
description
metadata JSONB
createdAt
```

### Payment

```text
id
userId
provider JAZZCASH | EASYPAISA
amount Decimal(18,2)
currency
merchantReference unique
providerTransactionId unique nullable
status CREATED | PENDING | SUCCESS | FAILED | CANCELLED | REVERSED
callbackVerified boolean
rawCallbackEncrypted text nullable
paidAt timestamp nullable
createdAt
updatedAt
```

### Vendor

```text
id
name
code unique
baseUrl
apiKeyEncrypted
status ACTIVE | INACTIVE | DEGRADED
priority integer
createdAt
updatedAt
```

### Country

```text
id
name
isoCode unique
dialCode
status ACTIVE | INACTIVE
```

### Service

```text
id
name
slug unique
logoUrl nullable
status ACTIVE | INACTIVE | BLOCKED
```

### VendorProduct

```text
id
vendorId
countryId
serviceId
vendorProductCode
vendorCost Decimal(18,2)
availableQuantity integer nullable
status ACTIVE | OUT_OF_STOCK | INACTIVE
lastSyncedAt
metadata JSONB
```

Unique constraint:

```text
(vendorId, countryId, serviceId, vendorProductCode)
```

### PricingRule

```text
id
vendorProductId
pricingMode FIXED_PRICE | FIXED_MARGIN | PERCENTAGE_MARGIN | HYBRID
fixedPrice Decimal(18,2) nullable
fixedMargin Decimal(18,2) nullable
percentageMargin Decimal(8,4) nullable
minimumProfit Decimal(18,2) nullable
bulkMinQuantity integer nullable
bulkDiscountPercentage Decimal(8,4) nullable
active boolean
startsAt timestamp nullable
endsAt timestamp nullable
```

### Order

```text
id
userId
orderNumber unique
status PENDING | PARTIAL | COMPLETED | FAILED | CANCELLED | REFUNDED
requestedQuantity integer
successfulQuantity integer
failedQuantity integer
subtotal Decimal(18,2)
discount Decimal(18,2)
total Decimal(18,2)
currency
idempotencyKey unique
createdAt
updatedAt
```

### Activation

```text
id
orderId
userId
vendorId
vendorProductId
phoneNumber
serviceNameSnapshot
countryNameSnapshot
vendorCostSnapshot Decimal(18,2)
sellingPriceSnapshot Decimal(18,2)
vendorActivationId nullable
otpEndpointEncrypted
status RESERVED | WAITING_FOR_OTP | OTP_RECEIVED | COMPLETED | EXPIRED | CANCELLED | REFUNDED | FAILED
otpEncrypted nullable
otpReceivedAt nullable
expiresAt nullable
completedAt nullable
failureReason nullable
createdAt
updatedAt
```

### Refund

```text
id
userId
orderId nullable
activationId nullable
walletTransactionId nullable
amount Decimal(18,2)
reason
status PENDING | COMPLETED | FAILED
idempotencyKey unique
createdAt
processedAt nullable
```

### KycRecord

```text
id
userId
type CNIC | PASSPORT | BUSINESS
status PENDING | VERIFIED | REJECTED
documentReferenceEncrypted
reviewedBy nullable
reviewedAt nullable
rejectionReason nullable
createdAt
updatedAt
```

### AuditLog

```text
id
actorUserId nullable
action
entityType
entityId
requestId
ipAddress
userAgent
beforeData JSONB nullable
afterData JSONB nullable
metadata JSONB nullable
createdAt
```

### AbuseFlag

```text
id
userId
activationId nullable
type
severity LOW | MEDIUM | HIGH | CRITICAL
status OPEN | REVIEWING | RESOLVED | CONFIRMED
reason
createdAt
resolvedAt nullable
```

## 3. Relationships

```text
User 1---1 Wallet
User 1---N Payment
User 1---N Order
User 1---N Activation
User 1---N KycRecord
Wallet 1---N WalletTransaction
Vendor 1---N VendorProduct
Country 1---N VendorProduct
Service 1---N VendorProduct
VendorProduct 1---N PricingRule
Order 1---N Activation
Activation 1---0..1 Refund
```

## 4. Financial Transaction Rules

### Wallet Debit

```sql
BEGIN;
SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE;
-- validate balance
-- create order and activation
-- insert wallet transaction
-- update wallet balance
COMMIT;
```

### Wallet Credit

Use the same row-locking process.

### Balance Invariant

```text
wallet.balance = sum(all completed credits) - sum(all completed debits)
```

Run a scheduled reconciliation job to detect mismatches.

## 5. Recommended Indexes

```text
users(email)
users(phone)
payments(merchantReference)
payments(providerTransactionId)
payments(userId, createdAt)
walletTransactions(walletId, createdAt)
walletTransactions(idempotencyKey)
orders(userId, createdAt)
orders(orderNumber)
activations(userId, status)
activations(orderId)
activations(vendorActivationId)
activations(expiresAt, status)
vendorProducts(serviceId, countryId, status)
auditLogs(entityType, entityId)
auditLogs(actorUserId, createdAt)
```

## 6. Data Protection

Encrypt:
- Vendor API keys
- OTP endpoints
- OTP values
- KYC document references
- Sensitive callback payloads

Hash:
- Passwords with Argon2id
- Refresh tokens

Never store:
- Plain gateway passwords
- Plain JWT secrets
- Full sensitive payment credentials

## 7. Retention

Suggested retention:
- Financial ledger: permanent or legal retention period
- Payment records: long-term
- OTP values: delete or irreversibly redact after a short period
- Raw gateway callbacks: encrypted and redacted
- Audit logs: at least 1 year
- Application logs: 30 to 90 days
