# Development Prompts

Use these prompts one by one in Claude Code. Before every phase, Claude must read:

```
CLAUDE.md
docs/api-endpoints.md
docs/architecture.md
docs/database.md
docs/user-flow.md
```

Keep every feature on its assigned Git branch. Do not mix unrelated work.

---

## Prompt 1 — Inspect Repository

```
Read CLAUDE.md and all files in docs.

Inspect the current repository before editing anything.

Check:
- Current Git branch
- Existing frontend and backend folders
- Installed packages
- TypeScript configuration
- Environment setup
- Prisma setup
- Existing routes, controllers, services, repositories, and pages
- Missing items compared with the project documentation

Do not write code yet.
Do not create files.
Do not install packages.

Return only:
- Current project status
- Existing modules
- Missing setup
- Recommended first task
- Current Git branch
```

---

## Prompt 2 — Project Setup

Branch:

```
feature/project-setup
```

```
Read CLAUDE.md and all files in docs.

Set up the USA Numbers Reseller App using the documented architecture.

Frontend:
- Next.js App Router
- TypeScript
- Tailwind CSS
- ShadCN UI
- Zustand
- Zod
- React Hook Form

Backend:
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- MVC structure

Tasks:
1. Create missing frontend and backend base folders.
2. Configure TypeScript, linting, and formatting.
3. Configure environment validation.
4. Configure Express app and server.
5. Configure Prisma and PostgreSQL.
6. Add central API response helpers.
7. Add central error handling.
8. Add route registration.
9. Add GET /health.
10. Add .env.example files without secrets.

Do not implement business features.
Do not add Redis or BullMQ yet.
Do not add fake business data.
Do not add unnecessary comments.

Run lint, type-check, build, and Prisma validation where available.

Return only:
- Files changed
- Setup completed
- Validation result
- Actual blockers
```

---

## Prompt 3 — Database and Prisma

Branch:

```
feature/project-setup
```

```
Read CLAUDE.md and docs/database.md.

Create the Prisma schema for these models:
- User
- Session
- Wallet
- WalletTransaction
- PaymentAccount
- TopupRequest
- Vendor
- Product
- InventoryNumber
- Order
- OrderItem
- PurchasedNumber
- OtpMessage
- RefundRequest
- Notification
- Announcement
- AppSetting
- AuditLog

Rules:
1. Use PostgreSQL.
2. Use Decimal for all money fields.
3. Add documented enums and relations.
4. Add indexes for userId, orderId, status, and createdAt where useful.
5. Add required unique constraints.
6. Do not cascade-delete financial history.
7. Add one migration.
8. Add seed data only for one admin, payment accounts, and basic settings.
9. Do not seed fake users, orders, OTPs, or transactions.

Run:
- npx prisma format
- npx prisma validate
- Migration command if the database is available

Return only:
- Models created
- Migration name
- Seed data added
- Validation result
- Actual blockers
```

---

## Prompt 4 — Authentication

Branch:

```
feature/authentication
```

```
Read CLAUDE.md and all docs.

Implement authentication.

Backend:
- POST /api/v1/auth/sign-up
- POST /api/v1/auth/sign-in
- GET /api/v1/auth/me
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- POST /api/v1/auth/logout-all
- POST /api/v1/auth/forgot-password
- POST /api/v1/auth/reset-password
- Authentication middleware
- Admin middleware
- Session management

Frontend:
- /sign-up
- /sign-in
- /forgot-password
- /reset-password

Rules:
1. Hash passwords with bcrypt or Argon2.
2. Use short-lived access tokens and database refresh sessions.
3. Create a wallet during sign-up.
4. Block suspended or blocked users.
5. Validate input with Zod.
6. Rate-limit sign-in and forgot-password.
7. Do not expose password hashes or refresh tokens.
8. Keep controllers small and business logic in services.
9. Do not add social login.
10. Do not fake email delivery when no provider is configured.

Add focused authentication tests.
Run lint, type-check, tests, and build.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
- Actual blockers
```

---

## Prompt 5 — User Layout

Branch:

```
feature/dashboard
```

```
Read CLAUDE.md and all docs.

Create the authenticated user layout.

Pages in navigation:
- Dashboard
- Active Numbers
- My Orders
- OTP History
- Wallet
- Updates Here
- Settings

Tasks:
1. Create responsive sidebar and mobile navigation.
2. Add top navbar and user menu.
3. Add logout action.
4. Protect authenticated routes.
5. Add loading and error states.
6. Reuse existing ShadCN components.

Do not implement feature business logic yet.
Do not add excessive animations.

Return only:
- Components created
- Pages created
- Routes protected
- Validation result
```

---

## Prompt 6 — Dashboard and Products

Branch:

```
feature/product-catalog
```

```
Read CLAUDE.md and all docs.

Implement the dashboard and product catalog.

Backend:
- GET /api/v1/dashboard
- GET /api/v1/products
- GET /api/v1/products/:productId

Dashboard data:
- Wallet balance
- Total orders
- Active numbers
- OTP count
- Available products
- Recent orders
- Recent active numbers

Product fields:
- Country
- Service
- Number type
- Selling price
- Available stock
- Refund window

Rules:
1. Never return vendor cost to users.
2. Add country, service, and number-type filters.
3. Use real database data.
4. Add loading, empty, and error states.
5. Do not implement order creation in this phase.
6. Do not add fake products.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 7 — Wallet

Branch:

```
feature/wallet
```

```
Read CLAUDE.md and all docs.

Implement the wallet module.

Backend:
- GET /api/v1/wallet
- GET /api/v1/wallet/transactions

Frontend:
- Wallet balance
- Total deposits
- Total purchases
- Total refunds
- Transaction history
- Filters and pagination
- Top Up button

Rules:
1. Calculate totals from wallet transactions.
2. Do not allow frontend balance changes.
3. Show transaction type, amount, status, reference, and date.
4. Add loading, empty, and error states.
5. Do not implement the top-up form yet.

Add tests for ownership, totals, pagination, and unauthorized access.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 8 — Wallet Top-Up

Branch:

```
feature/wallet-topup
```

```
Read CLAUDE.md and all docs.

Implement the user wallet top-up request flow.

Backend:
- GET /api/v1/topups/payment-accounts
- POST /api/v1/topups
- GET /api/v1/topups
- GET /api/v1/topups/:topupId
- POST /api/v1/topups/:topupId/cancel

Frontend top-up modal:
- Payment account details
- Payment method
- Amount
- Sender account
- Transaction ID
- Optional screenshot
- Optional notes
- Send request button

Flow:
1. Load active payment accounts.
2. Create a PENDING request.
3. Generate the admin WhatsApp message URL.
4. Open WhatsApp only after the request is saved.
5. Do not credit the wallet.

Rules:
1. Read minimum top-up amount from settings.
2. Prevent obvious duplicate transaction IDs.
3. Allow cancellation only for PENDING requests.
4. Restrict screenshots to approved image types and size.
5. Do not add automatic payment gateway integration.

Add focused tests.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 9 — Admin Layout and Dashboard

Branch:

```
feature/admin-dashboard
```

```
Read CLAUDE.md and all docs.

Create the protected admin layout.

Navigation:
- Dashboard
- Users
- Top-Ups
- Payment Accounts
- Products
- Inventory
- Orders
- Refunds
- Announcements
- Settings

Backend:
- GET /api/v1/admin/dashboard

Statistics:
- Total users
- Total orders
- Pending top-ups
- Pending refunds
- Total deposits
- Total purchases
- Available stock

Rules:
1. Allow ADMIN role only.
2. Add responsive admin navigation.
3. Add empty page shells for modules not implemented yet.
4. Do not expose vendor secrets.

Return only:
- Admin layout created
- Dashboard added
- Routes protected
- Validation result
```

---

## Prompt 10 — Admin Top-Up Approval

Branch:

```
feature/admin-topup-management
```

```
Read CLAUDE.md and all docs.

Implement admin top-up management.

Backend:
- GET /api/v1/admin/topups
- GET /api/v1/admin/topups/:topupId
- POST /api/v1/admin/topups/:topupId/approve
- POST /api/v1/admin/topups/:topupId/reject

Frontend:
- Request list
- Filters
- Request details
- Payment screenshot
- User details
- Approve action
- Reject action with reason

Approval must run in one database transaction:
1. Confirm request is approvable.
2. Credit wallet.
3. Create DEPOSIT wallet transaction.
4. Mark request APPROVED.
5. Save admin and review time.
6. Create notification.
7. Create audit log.

Rejection must save reason, admin, review time, notification, and audit log.

Rules:
1. Prevent duplicate approval.
2. Never update wallet without a transaction record.
3. Do not approve cancelled, approved, or rejected requests.
4. Roll back all changes on failure.

Add tests for approval, duplicate approval, rejection, authorization, and rollback.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 11 — Product Management

Branch:

```
feature/admin-product-management
```

```
Read CLAUDE.md and all docs.

Implement admin product management.

Backend:
- GET /api/v1/admin/products
- POST /api/v1/admin/products
- GET /api/v1/admin/products/:productId
- PATCH /api/v1/admin/products/:productId
- DELETE /api/v1/admin/products/:productId

Frontend fields:
- Name
- Country
- Country code
- Service
- Number type
- Description
- Vendor cost
- Selling price
- Refund window
- Available stock
- Status

Rules:
1. Vendor cost is admin-only.
2. Prevent negative price and stock.
3. Disable products instead of deleting related history.
4. Keep fields aligned with docs/database.md.
5. Do not add extra category systems.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 12 — Number Inventory

Branch:

```
feature/number-inventory
```

```
Read CLAUDE.md and all docs.

Implement inventory management.

Backend:
- GET /api/v1/admin/inventory
- POST /api/v1/admin/inventory
- POST /api/v1/admin/inventory/bulk-upload
- PATCH /api/v1/admin/inventory/:numberId

Frontend:
- Inventory list
- Add one number
- CSV bulk upload
- Product selection
- Number
- API URL
- Vendor reference
- Expiry
- Status

Statuses:
- AVAILABLE
- RESERVED
- SOLD
- EXPIRED
- DISABLED

Rules:
1. Phone numbers must be unique.
2. Validate every CSV row.
3. Return invalid row details without crashing the whole import.
4. Do not expose private tokens.
5. Do not hard-delete sold inventory.
6. Keep product stock in sync.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 13 — Orders and Purchases

Branch:

```
feature/orders
```

```
Read CLAUDE.md and all docs.

Implement number purchasing using manual inventory first.

Backend:
- POST /api/v1/orders
- GET /api/v1/orders
- GET /api/v1/orders/:orderId

Frontend:
- Purchase confirmation modal
- My Orders page
- Order details page

Purchase database transaction:
1. Validate user and product.
2. Read price from database.
3. Check stock and wallet balance.
4. Reserve available inventory numbers.
5. Create order and items.
6. Deduct wallet.
7. Create PURCHASE wallet transaction.
8. Create purchased-number records.
9. Mark inventory SOLD.
10. Update stock.
11. Commit.

Rules:
1. Do not trust frontend totals.
2. Prevent negative wallet balance.
3. Prevent the same number from selling twice.
4. Add idempotency protection.
5. Roll back everything on failure.
6. Do not integrate vendor API yet.

Add tests for single purchase, bulk purchase, low balance, low stock, duplicate request, concurrency, and rollback.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 14 — Active Numbers

Branch:

```
feature/active-numbers
```

```
Read CLAUDE.md and all docs.

Implement Active Numbers.

Backend:
- GET /api/v1/numbers
- GET /api/v1/numbers/:numberId
- POST /api/v1/numbers/:numberId/check-otp

Frontend:
- Phone number
- Service
- Status
- OTP count
- Purchase time
- Expiry time
- Copy number
- View details
- Check OTP
- Filters and pagination

Rules:
1. Verify ownership on every request.
2. Mask private API URLs and tokens.
3. Do not fake OTP results.
4. Return a clear not-configured response until vendor integration exists.
5. Add loading, empty, and error states.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 15 — Vendor Integration

Branch:

```
feature/vendor-integration
```

```
Read CLAUDE.md and all docs.

Implement vendor integration behind one internal interface.

Operations:
- Check balance
- Check stock
- Buy number
- Fetch messages
- Cancel number
- Request refund if supported

Structure:
- integrations/vendor/vendor.client.ts
- integrations/vendor/vendor.service.ts
- integrations/vendor/vendor.mapper.ts
- integrations/vendor/vendor.types.ts

Rules:
1. Keep vendor-specific code inside the vendor integration folder.
2. Encrypt stored credentials.
3. Never expose keys or vendor cost.
4. Add request timeout and simple retry handling.
5. Validate vendor responses.
6. Map vendor statuses to internal statuses.
7. Save required vendor reference IDs.
8. Do not log secrets or OTPs.
9. Keep manual inventory working.
10. If vendor API documentation is missing, create interfaces only and list missing details. Do not guess endpoints.

Return only:
- Integration structure
- Operations implemented
- Missing vendor information
- Files changed
- Validation result
```

---

## Prompt 16 — OTP Fetching

Branch:

```
feature/otp-fetching
```

```
Read CLAUDE.md and all docs.

Implement OTP fetching.

Required logic:
1. Verify number ownership.
2. Call vendor message API.
3. Save new raw messages.
4. Extract OTP.
5. Prevent duplicate messages.
6. Update OTP count.
7. Update number and order status.
8. Create notification.
9. Track last checked time.

Rules:
1. Use vendorMessageId or messageHash for duplicates.
2. Keep OTP parsing in one utility.
3. Do not log OTP values.
4. Rate-limit manual checks.
5. Stop checking expired, refunded, completed, or disabled numbers.
6. Do not create fake messages.
7. Keep polling interval configurable.
8. Start with manual checks.
9. Add Redis and BullMQ only when automatic polling is needed and approved.

Add tests for new OTP, duplicate OTP, no message, unauthorized access, expired number, and vendor failure.

Return only:
- Features completed
- Worker status
- Files changed
- Tests and validation
```

---

## Prompt 17 — OTP History

Branch:

```
feature/otp-history
```

```
Read CLAUDE.md and all docs.

Implement OTP History.

Backend:
- GET /api/v1/otp-history
- GET /api/v1/otp-history/:otpId

Frontend:
- Number
- Service
- Raw message
- OTP code
- Received time
- Copy OTP
- Number, service, and date filters
- Pagination

Rules:
1. Users can only access their own OTP records.
2. Do not expose vendor message IDs.
3. Add loading, empty, and error states.
4. Do not add export features unless requested.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 18 — Refunds

Branch:

```
feature/refunds
```

```
Read CLAUDE.md and all docs.

Implement user and admin refunds.

User endpoints:
- POST /api/v1/refunds
- GET /api/v1/refunds
- GET /api/v1/refunds/:refundId

Admin endpoints:
- GET /api/v1/admin/refunds
- GET /api/v1/admin/refunds/:refundId
- POST /api/v1/admin/refunds/:refundId/approve
- POST /api/v1/admin/refunds/:refundId/reject

Rules:
1. Check ownership.
2. Check refund window.
3. Check order and number status.
4. Check if OTP was received.
5. Prevent duplicate refund requests.
6. Approval must run in one transaction.
7. Approval must credit wallet and create REFUND transaction.
8. Update refund, order, and number statuses.
9. Create notification and audit log.
10. Do not edit the original purchase transaction.
11. Save rejection reason.

Add tests for eligibility, expired window, OTP already received, duplicate request, approval, duplicate approval, and rollback.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 19 — Notifications and Updates

Branches:

```
feature/notifications
feature/announcements
```

```
Read CLAUDE.md and all docs.

Implement notifications and announcements.

Notification endpoints:
- GET /api/v1/notifications
- PATCH /api/v1/notifications/:notificationId/read
- PATCH /api/v1/notifications/read-all

Create notifications for:
- Top-up approved or rejected
- OTP received
- Refund approved or rejected
- Order failed

Announcement endpoints:
- GET /api/v1/announcements
- Admin CRUD endpoints from docs/api-endpoints.md

Updates page:
- Published announcements
- Contact Admin
- Support WhatsApp link
- Official channel link

Rules:
1. Users can update only their own notifications.
2. Show only published and non-expired announcements.
3. Keep notifications database-based.
4. Do not add push-notification services.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 20 — User Settings

Branch:

```
feature/user-profile-settings
```

```
Read CLAUDE.md and all docs.

Implement user settings.

Backend:
- GET /api/v1/users/profile
- PATCH /api/v1/users/profile
- PATCH /api/v1/users/password
- GET /api/v1/users/sessions
- DELETE /api/v1/users/sessions/:sessionId

Frontend:
- Profile details
- Update name
- Update WhatsApp number
- Change password
- Active sessions
- Remove session

Rules:
1. Prevent duplicate WhatsApp numbers.
2. Require current password for password changes.
3. Do not expose password hashes or refresh tokens.
4. Verify session ownership.
5. Keep settings simple.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 21 — Admin User Management

Branch:

```
feature/admin-user-management
```

```
Read CLAUDE.md and all docs.

Implement admin user management.

Backend:
- GET /api/v1/admin/users
- GET /api/v1/admin/users/:userId
- PATCH /api/v1/admin/users/:userId/status
- POST /api/v1/admin/users/:userId/wallet/credit
- POST /api/v1/admin/users/:userId/wallet/debit

Frontend:
- User list
- Search and status filter
- User details
- Wallet summary
- Order summary
- Activate, suspend, or block
- Manual wallet adjustment

Rules:
1. Require adjustment amount and reason.
2. Create wallet transaction and audit log.
3. Prevent negative balance.
4. Do not delete financial history.
5. Add a safeguard against an admin blocking themselves.

Add focused tests.

Return only:
- Features completed
- Endpoints added
- Files changed
- Tests and validation
```

---

## Prompt 22 — Admin Settings

Branch:

```
feature/admin-settings
```

```
Read CLAUDE.md and all docs.

Implement payment accounts and app settings.

Payment accounts:
- GET /api/v1/admin/payment-accounts
- POST /api/v1/admin/payment-accounts
- PATCH /api/v1/admin/payment-accounts/:accountId
- DELETE /api/v1/admin/payment-accounts/:accountId

App settings:
- GET /api/v1/admin/settings
- PATCH /api/v1/admin/settings

Required settings:
- Minimum top-up amount
- Admin WhatsApp number
- Support WhatsApp number
- OTP polling interval
- Default refund rules

Rules:
1. Disable payment accounts with history instead of deleting them.
2. Validate all values.
3. Do not expose private admin settings to users.
4. Create audit logs for important changes.

Return only:
- Features completed
- Endpoints added
- Files changed
- Validation result
```

---

## Prompt 23 — Security Review

Branch:

```
feature/security
```

```
Read CLAUDE.md and all docs.

Review the app security and fix only real problems.

Check:
- Authentication and sessions
- Admin authorization
- User ownership checks
- Input validation
- Rate limiting
- CORS and Helmet
- File upload restrictions
- Secret handling
- Vendor credentials
- Sensitive logs
- Wallet transactions
- Duplicate top-up approval
- Duplicate refund approval
- OTP access
- Error exposure

Do not rewrite working modules without reason.
Do not add heavy packages without need.
Do not add unrelated features.

Return only:
- Problems found
- Problems fixed
- Files changed
- Validation result
- Remaining risks
```

---

## Prompt 24 — Testing

Branch:

```
feature/testing
```

```
Read CLAUDE.md and all docs.

Add focused tests for critical business flows.

Required areas:
- Authentication
- Wallet totals
- Wallet credit and debit
- Top-up approval and duplicate approval
- Order purchase
- Insufficient balance
- Concurrent purchase
- Duplicate OTP prevention
- Refund eligibility and approval
- Admin authorization
- User ownership

Rules:
1. Focus on business logic and API behavior.
2. Do not test every visual detail.
3. Use a separate test database.
4. Clean test data after tests.
5. Do not use production credentials.

Run tests, lint, type-check, and builds.

Return only:
- Tests added
- Tests passed
- Tests failed
- Files changed
- Actual blockers
```

---

## Prompt 25 — Deployment

Branch:

```
feature/deployment
```

```
Read CLAUDE.md and all docs.

Prepare the app for deployment.

Frontend:
- Production build
- API base URL configuration
- Vercel-compatible setup

Backend:
- Production build
- Environment validation
- GET /health
- Migration and start commands
- Production CORS
- Safe logging

Database:
- Managed PostgreSQL setup instructions
- Prisma migration workflow
- Backup notes

Optional:
- Dockerfile
- docker-compose for local development

Rules:
1. Never hardcode secrets.
2. Never commit .env files.
3. Keep deployment simple.
4. Do not add Kubernetes.
5. Do not split into microservices.
6. Add Redis only when OTP polling requires it.
7. Add a concise deployment section to README.

Run frontend build, backend build, Prisma validation, and tests.

Return only:
- Deployment files added
- Required environment variables
- Build result
- Migration steps
- Actual blockers
```

---

## Prompt 26 — Final Review

```
Read CLAUDE.md and all docs.

Review the completed USA Numbers Reseller App.
Do not add new features.

Check:
1. All documented user pages exist.
2. All documented admin pages exist.
3. API endpoints match docs/api-endpoints.md.
4. Database matches docs/database.md.
5. Backend follows MVC.
6. Wallet changes use database transactions.
7. Top-ups cannot be approved twice.
8. Wallet balance cannot become negative.
9. One inventory number cannot be sold twice.
10. OTP messages cannot be duplicated.
11. Refunds cannot be approved twice.
12. Users cannot access another user's data.
13. Admin routes are protected.
14. Vendor keys and costs are hidden.
15. No fake data remains.
16. No debug logs remain.
17. No unfinished TODO items remain.
18. Lint, type-check, tests, and builds pass.

Fix only real issues found.

Return only:
- Issues found
- Issues fixed
- Validation results
- Remaining blockers
- Production readiness status
```

---

## Reusable Prompt — Before Every Feature

```
Read CLAUDE.md and all files in docs.
Check the current Git branch and confirm this task belongs to it.
Inspect existing related files before editing.
Follow the current architecture and code patterns.

Do not:
- Modify unrelated code
- Add unnecessary packages
- Add excessive comments
- Create duplicate files
- Add fake data
- Change the documented scope
- Over-engineer the feature

After implementation, run relevant validation and return a concise result.
```

---

## Reusable Prompt — Bug Fix

```
Read CLAUDE.md and inspect the related code.
Identify the root cause before changing code.
Fix only the actual problem.
Add or update one focused test.

Do not:
- Rewrite the full module
- Change unrelated files
- Add new features
- Hide errors with fake fallback data
- Add unnecessary comments

Run relevant validation.

Return only:
- Root cause
- Fix
- Files changed
- Test result
- Remaining blocker
```

---

## Reusable Prompt — Before Commit

```
Review the current Git diff.

Check:
- No unrelated files changed
- No .env files or secrets included
- No vendor keys included
- No debug logs included
- No fake data included
- No excessive comments included
- No unfinished TODO items included
- Prisma migration is included with schema changes
- Lint and type-check pass

Do not commit automatically unless instructed.
Suggest one concise Conventional Commit message.

Return only:
- Changed files
- Issues found
- Validation result
- Suggested commit message
```
