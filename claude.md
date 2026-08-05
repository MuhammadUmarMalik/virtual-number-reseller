# CLAUDE.md

## Project

Build a USA numbers reseller web application with:

* Next.js frontend
* Node.js and Express backend
* TypeScript
* PostgreSQL
* Prisma ORM
* Tailwind CSS
* ShadCN UI
* Zustand
* Zod
* MVC architecture

Keep the application simple, maintainable and suitable for an MVP.

---

## Core Rules

1. Follow the existing project structure.
2. Do not create unnecessary files, layers or abstractions.
3. Do not use microservices.
4. Do not change the selected technology stack.
5. Use TypeScript for all frontend and backend code.
6. Use strict TypeScript types.
7. Do not use `any` unless no practical alternative exists.
8. Reuse existing components and utilities before creating new ones.
9. Do not duplicate business logic.
10. Do not install packages without a clear need.
11. Do not modify unrelated code.
12. Keep responses, plans and explanations concise.
13. Use as few tokens as possible while remaining clear.
14. Do not add long summaries after completing tasks.
15. Do not add extra recommendations unless requested.
16. Do not add excessive code comments.
17. Add comments only for complex business logic.
18. Do not add comments that repeat what the code already says.
19. Do not create documentation files unless requested.
20. Do not leave placeholder code, fake data or unfinished TODO items.

---

## Working Method

Before making changes:

1. Read the relevant files.
2. Understand the current implementation.
3. Identify the smallest required change.
4. Reuse existing patterns.
5. Implement only the requested scope.
6. Run relevant validation, type checks or tests.
7. Report only:
   * Files changed
   * Main changes
   * Validation result
   * Any actual blocker

Do not explain basic programming concepts unless asked.

---

## Architecture

Use this backend request flow:

```text
Route
→ Middleware
→ Controller
→ Service
→ Repository
→ Prisma
→ PostgreSQL
```

### Routes

Routes must only:

* Define endpoints
* Apply middleware
* Connect requests to controllers

Do not add business logic inside routes.

### Controllers

Controllers must only:

* Read request data
* Call services
* Return responses
* Pass errors to error middleware

Keep controllers small.

### Services

Services contain:

* Business rules
* Wallet operations
* Number purchasing
* Top-up processing
* OTP processing
* Refund processing
* Vendor integration coordination

### Repositories

Repositories contain Prisma database queries.

Do not place HTTP logic or business rules inside repositories.

### Middleware

Use middleware for:

* Authentication
* Admin authorization
* Validation
* Rate limiting
* Error handling

---

## Frontend Rules

Use the Next.js App Router.

Main pages:

```text
/sign-in
/sign-up
/dashboard
/active-numbers
/orders
/otp-history
/wallet
/updates
/settings
/admin
```

Frontend rules:

1. Keep page files small.
2. Move reusable UI into components.
3. Put API calls inside service files.
4. Use Zustand only for shared client state.
5. Use local state for page-specific UI.
6. Use Zod for form validation.
7. Use React Hook Form for forms.
8. Use ShadCN UI components where suitable.
9. Handle loading, empty and error states.
10. Do not expose vendor keys, private tokens or internal costs.
11. Do not trust prices or balances calculated by the frontend.
12. Keep layouts responsive.
13. Avoid unnecessary animations.
14. Do not add new design styles that conflict with the existing UI.

---

## Backend Rules

1. Use REST endpoints under `/api/v1`.
2. Validate all request bodies, parameters and query values.
3. Use a common API response format.
4. Use central error middleware.
5. Use async error handling.
6. Never expose stack traces in production.
7. Never trust values received from the frontend.
8. Read product prices from the database.
9. Check user ownership before returning private data.
10. Use pagination for list endpoints.
11. Use database transactions for wallet and order operations.
12. Add audit logs for admin financial actions.
13. Never store plain-text passwords.
14. Never return password hashes.
15. Never expose vendor API keys.

Recommended response format:

```json
{
  "success": true,
  "message": "Request completed",
  "data": {}
}
```

Recommended error format:

```json
{
  "success": false,
  "message": "Request failed",
  "errors": []
}
```

---

## Authentication

Use:

* Short-lived access tokens
* Refresh tokens
* Hashed passwords
* Protected routes
* User and admin roles

Rules:

1. Store passwords using bcrypt or Argon2.
2. Store refresh-token sessions in the database.
3. Check user status during login.
4. Block suspended or blocked accounts.
5. Apply rate limiting to authentication endpoints.
6. Do not store sensitive tokens in plain text where avoidable.

---

## Wallet Rules

Wallet data is financial data.

Strictly follow these rules:

1. Never update wallet balance without creating a transaction record.
2. Never delete wallet transaction records.
3. Use PostgreSQL transactions for credits and debits.
4. Lock or safely update the wallet during purchase and approval operations.
5. Store:
   * Balance before
   * Transaction amount
   * Balance after
   * Transaction type
   * Reference ID
   * Timestamp
6. Never allow a negative wallet balance.
7. Never accept the wallet balance from the frontend.
8. Use reversal transactions instead of editing old transactions.
9. Admin adjustments must create audit logs.
10. Prevent duplicate top-up approval.

Wallet transaction types:

```text
DEPOSIT
PURCHASE
REFUND
ADJUSTMENT_CREDIT
ADJUSTMENT_DEBIT
REVERSAL
```

---

## Top-Up Rules

Top-up flow:

```text
User submits request
→ Request saved as PENDING
→ WhatsApp message opens
→ Admin verifies payment
→ Admin approves or rejects
→ Approved amount is credited
→ Wallet transaction is created
→ User receives notification
```

Rules:

1. Save the top-up request before opening WhatsApp.
2. WhatsApp does not automatically approve payment.
3. Only admins can approve or reject requests.
4. Approval and wallet credit must run in one database transaction.
5. A request can only be approved once.
6. Validate minimum and maximum amounts.
7. Store transaction ID and sender account when provided.
8. Prevent obvious duplicate transaction IDs.
9. Save the reviewing admin and review timestamp.
10. Record rejection reasons.

---

## Order Rules

Number purchase flow:

```text
Validate user
→ Validate product
→ Check stock
→ Check wallet balance
→ Create order
→ Deduct wallet amount
→ Request or assign number
→ Save purchased number
→ Create wallet transaction
→ Return result
```

Rules:

1. Read selling price from the database.
2. Do not trust frontend totals.
3. Use a database transaction.
4. Prevent double purchases caused by repeated requests.
5. Use an idempotency key where needed.
6. Save vendor responses needed for debugging.
7. Never expose vendor cost to users.
8. Handle partial failures safely.
9. Refund the wallet when purchase failure requires it.
10. Each purchased number must belong to one user and one order.

---

## OTP Rules

1. Only return OTP messages to the number owner or an authorized admin.
2. Save the original message and extracted OTP.
3. Prevent duplicate messages using a vendor message ID or message hash.
4. Do not log OTP codes in production logs.
5. Apply rate limits to manual OTP checks.
6. Track the last message check time.
7. Stop polling expired, refunded or completed numbers.
8. Handle vendor API errors without creating duplicate orders or messages.
9. Keep OTP parsing logic in one utility or service.
10. Do not expose private vendor tokens.

---

## Refund Rules

1. Check the product refund window.
2. Check order and number status.
3. Check if an OTP was already received.
4. Create a refund request before crediting the wallet.
5. Admin approval may be required.
6. Wallet refund and status update must run in one transaction.
7. Create a `REFUND` wallet transaction.
8. Prevent duplicate refunds.
9. Save the reason and reviewing admin.
10. Do not edit the original purchase transaction.

---

## Prisma and Database Rules

1. Use Prisma migrations.
2. Do not manually change production tables.
3. Use `Decimal` for money.
4. Do not use floating-point values for balances or prices.
5. Add indexes to frequently filtered columns.
6. Add unique constraints for business identifiers.
7. Use clear relation names.
8. Use cascade deletion carefully.
9. Do not delete financial records when deleting or disabling a user.
10. Prefer user suspension over permanent deletion.
11. Update the Prisma schema and migration together.
12. Seed only required development data.

---

## API Rules

Use these endpoint groups:

```text
/api/v1/auth
/api/v1/users
/api/v1/dashboard
/api/v1/products
/api/v1/orders
/api/v1/numbers
/api/v1/otp-history
/api/v1/wallet
/api/v1/topups
/api/v1/refunds
/api/v1/announcements
/api/v1/notifications
/api/v1/admin
```

Rules:

1. Use proper HTTP methods.
2. Use plural resource names.
3. Keep endpoint naming consistent.
4. Do not add duplicate endpoints for the same action.
5. Protect user routes with authentication.
6. Protect admin routes with authentication and admin authorization.
7. Use query parameters for filters and pagination.
8. Return suitable HTTP status codes.
9. Do not expose internal errors.
10. Document new endpoints only when requested.

---

## Security Rules

1. Validate all external input.
2. Apply rate limiting.
3. Use secure HTTP headers.
4. Configure CORS using approved frontend origins.
5. Keep secrets in environment variables.
6. Never commit `.env` files.
7. Encrypt sensitive vendor credentials.
8. Protect admin actions.
9. Add audit logs for financial changes.
10. Prevent users from accessing other users’ orders, numbers or OTPs.
11. Sanitize uploaded file names and types.
12. Restrict payment screenshot file size and format.
13. Do not log passwords, tokens, OTPs or full payment details.
14. Do not place secrets in frontend environment variables.
15. Follow applicable telecom, privacy, anti-spam and platform rules.

---

## Code Style

1. Use meaningful names.
2. Keep functions small.
3. Prefer early returns.
4. Avoid deep nesting.
5. Avoid duplicated code.
6. Avoid premature abstraction.
7. Do not create generic helpers for one-time logic.
8. Use named exports unless the current project uses another pattern.
9. Keep imports ordered and remove unused imports.
10. Remove dead code.
11. Do not add large comment blocks.
12. Do not add generated-looking comments.
13. Comment only complex financial, concurrency or vendor-specific behavior.
14. Follow the existing formatter and lint configuration.

---

## Testing and Validation

After relevant changes, run available commands such as:

```bash
npm run lint
npm run type-check
npm run test
npm run build
npx prisma validate
```

Do not claim that validation passed unless the command was actually run.

For wallet, order, top-up and refund logic, test:

* Successful operation
* Insufficient balance
* Duplicate request
* Unauthorized access
* Invalid status
* Concurrent request
* Vendor failure
* Transaction rollback

---

## Response Format

Keep the final response brief.

Use this format:

```text
Completed:
- Main change
- Main change

Files changed:
- path/file.ts
- path/file.ts

Validation:
- Command: passed/failed/not run

Blockers:
- Only include real blockers
```

Do not include:

* Long explanations
* Repeated code
* Basic tutorials
* Unrequested alternatives
* Unrequested documentation
* Excessive comments
* Large summaries
