# Product Requirements Document

## 1. Product Name

Working name: USA Number Reseller

## 2. Product Summary

The product is a wallet-based web application where users can buy temporary USA numbers individually or in bulk. Users receive OTP status and OTP values inside their account. The platform buys numbers from one or more vendors and resells them using admin-controlled pricing.

The first wallet top-up must be at least PKR 500. Supported payment methods are JazzCash and Easypaisa merchant gateways.

## 3. Product Goals

- Let users buy numbers in a few steps.
- Support single and bulk orders.
- Show real-time activation and OTP status.
- Maintain an accurate internal wallet ledger.
- Let admins control prices and margins.
- Handle failed activations and refunds safely.
- Support multiple vendors through adapters.
- Reduce fraud and misuse.

## 4. Non-Goals for MVP

- Mobile applications
- Cryptocurrency payments
- Peer-to-peer number resale
- Public vendor API access
- Complex affiliate system
- Automated vendor settlement
- Multi-currency support

## 5. User Roles

### User
- Register
- Complete verification
- Add wallet balance
- Buy numbers
- View OTPs
- View orders
- View wallet transactions
- Submit support request

### Support
- View users
- View orders and activations
- View payment status
- Add internal notes
- Escalate refunds
- Cannot change prices or balances

### Admin
- Full user management
- Wallet adjustments
- Payment review
- Vendor management
- Service and country management
- Pricing and margin management
- Reports
- KYC review
- Abuse controls
- Audit log access

## 6. User Stories

### Registration
- As a new user, I can create an account.
- As a user, I can verify my email or phone.
- As an admin, I can suspend abusive accounts.

### Wallet
- As a user, I can view my wallet balance.
- As a new user, I must add at least PKR 500 on my first top-up.
- As a user, I can view each wallet credit and debit.

### Payments
- As a user, I can pay through JazzCash.
- As a user, I can pay through Easypaisa.
- As a user, I can see pending, successful, or failed payment status.

### Number Purchase
- As a user, I can select service, country, and quantity.
- As a user, I can see the final price before purchase.
- As a user, I can buy one number.
- As a user, I can buy multiple numbers in one order.

### OTP
- As a user, I can view activation status.
- As a user, I can copy my assigned number.
- As a user, I can copy the OTP after it arrives.
- As a user, I can see the expiry countdown.

### Refund
- As a user, I receive a wallet refund when a refundable activation fails.
- As an admin, I can review refund failures.

## 7. Functional Requirements

### Authentication

- Email and password registration
- Login and logout
- Access and refresh tokens
- Password reset
- Email verification
- Optional phone verification
- Account status checks

### Initial Top-up Rule

- New user wallet starts at PKR 0.
- First successful top-up must be at least PKR 500.
- Number purchase stays blocked until initial top-up is complete.
- Later minimum top-up can be configurable.

### Catalog

User can select:
- Service
- Country
- Quantity

System shows:
- Price per number
- Bulk discount when applicable
- Final price
- Availability
- Current wallet balance

### Purchase

- Backend recalculates the price.
- Backend checks user status and KYC rules.
- Backend checks wallet balance.
- Backend reserves requested numbers.
- Backend creates one activation per number.
- Backend deducts only successful activation amounts.
- Backend returns partial success results for bulk orders.

### OTP Status

- RESERVED
- WAITING_FOR_OTP
- OTP_RECEIVED
- COMPLETED
- EXPIRED
- CANCELLED
- REFUNDED
- FAILED

### Admin Pricing

Admin can configure:
- Fixed selling price
- Fixed profit
- Percentage markup
- Minimum profit
- Bulk discount
- Service availability
- Vendor priority

### Reports

Admin reports:
- Total top-ups
- Total wallet credits
- Total wallet debits
- Sales revenue
- Vendor cost
- Gross profit
- Refund amount
- Active users
- Orders by service
- Orders by country
- Vendor success rate

## 8. Main Pages

### Public

```text
/
/login
/register
/forgot-password
/terms
/privacy
/acceptable-use
```

### User

```text
/dashboard
/buy-number
/my-numbers
/orders
/wallet
/wallet/top-up
/transactions
/profile
/support
```

### Admin

```text
/admin
/admin/users
/admin/kyc
/admin/wallets
/admin/payments
/admin/orders
/admin/activations
/admin/vendors
/admin/services
/admin/countries
/admin/pricing
/admin/refunds
/admin/reports
/admin/audit-logs
/admin/settings
```

## 9. UX Requirements

- Mobile responsive
- Clear wallet balance in header
- Buy flow on one page
- Quantity selector with single and bulk modes
- Visible total before confirmation
- Confirmation modal before purchase
- Loading and retry states
- Copy buttons for number and OTP
- Countdown for expiry
- Bulk results table
- Clear refund status

## 10. API Requirements

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Wallet

```text
GET  /api/wallet
GET  /api/wallet/transactions
```

### Payments

```text
POST /api/payments/top-up
POST /api/payments/jazzcash/callback
POST /api/payments/easypaisa/callback
GET  /api/payments/:id
```

### Catalog

```text
GET /api/catalog/services
GET /api/catalog/countries
GET /api/catalog/quotes
```

### Orders

```text
POST /api/orders
GET  /api/orders
GET  /api/orders/:id
```

### Activations

```text
GET  /api/activations
GET  /api/activations/:id
GET  /api/activations/:id/status
POST /api/activations/:id/cancel
```

## 11. Acceptance Criteria

### First Top-up
- A new user cannot purchase before a successful PKR 500 top-up.
- A PKR 499 first top-up is rejected.
- A successful gateway callback credits wallet once.

### Purchase
- Price is calculated on the backend.
- Wallet cannot become negative.
- Duplicate purchase request does not create duplicate orders.
- Bulk order returns successful and failed items separately.

### OTP
- User can only access owned activations.
- Vendor OTP URL never appears in frontend or API output.
- OTP status updates without reloading the page.

### Refund
- Failed refundable activation creates one refund.
- Duplicate refund processing does not credit twice.

## 12. Compliance and Abuse Controls

- Acceptable-use policy
- Service blocklist
- Rate limits
- Purchase limits
- KYC thresholds
- Suspicious order review
- Account suspension
- Audit logs
- Abuse reporting
- Data retention and OTP redaction
