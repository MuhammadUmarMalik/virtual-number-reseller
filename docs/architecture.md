# Architecture

## 1. Technology Stack

### Frontend

* Next.js
* TypeScript
* Tailwind CSS
* ShadCN UI
* Zustand
* Zod
* React Hook Form

### Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* PostgreSQL

### Optional Worker

* Redis
* BullMQ

Redis and BullMQ are only needed when automatic OTP polling is added.

---

## 2. Application Structure

The project uses one frontend, one backend, and one database.

```
Next.js Frontend
       |
       | HTTPS REST API
       v
Express Backend
       |
       | Prisma
       v
PostgreSQL Database
       |
       v
Vendor Number and OTP API
```

This is enough for the first version. Do not split the project into microservices.

---

## 3. Backend MVC Flow

```
Route
  |
  v
Middleware
  |
  v
Controller
  |
  v
Service
  |
  v
Repository
  |
  v
Prisma
  |
  v
PostgreSQL
```

### Route

Routes define API paths and connect them to controllers.

Example:

```
POST /api/v1/topups
```

### Middleware

Middleware handles:

* Authentication
* Admin role checks
* Request validation
* Rate limiting
* Error handling

### Controller

Controllers:

* Read request data
* Call services
* Return API responses

Controllers should not contain business logic.

### Service

Services contain the main app logic.

Examples:

* Approving top-up requests
* Deducting wallet balance
* Purchasing numbers
* Fetching OTPs
* Processing refunds

### Repository

Repositories contain Prisma database queries.

### Prisma

Prisma connects the backend to PostgreSQL.

---

## 4. Frontend Architecture

```
Page
  |
  v
Component
  |
  v
Frontend Service
  |
  v
Backend API
```

### Pages

Main user pages:

```
/sign-in
/sign-up
/dashboard
/active-numbers
/orders
/otp-history
/wallet
/updates
/settings
```

Main admin pages:

```
/admin/dashboard
/admin/users
/admin/topups
/admin/products
/admin/inventory
/admin/orders
/admin/refunds
/admin/announcements
/admin/settings
```

### Components

Reusable components should be placed in feature folders.

Example:

```
components/
  wallet/
  orders/
  numbers/
  otp/
  admin/
  shared/
```

### Frontend Services

All API requests should stay inside service files.

Example:

```
services/
  auth.service.ts
  wallet.service.ts
  order.service.ts
  number.service.ts
  otp.service.ts
```

### State

Use:

* Local state for modals, filters, and page UI
* Zustand for shared client state
* Server data from backend APIs

Do not store wallet balance or product price as trusted frontend data.

---

## 5. Main Business Modules

### Authentication

Handles:

* Sign up
* Sign in
* Logout
* Refresh token
* Password reset
* User roles

### Wallet

Handles:

* Wallet balance
* Deposits
* Purchases
* Refunds
* Manual adjustments

Every balance change must create a wallet transaction.

### Top-Up

Handles:

* Payment account details
* User top-up request
* WhatsApp message link
* Admin approval
* Wallet credit

### Products

Handles:

* Country
* Service
* Number type
* Selling price
* Stock
* Refund time

### Orders

Handles:

* Product purchase
* Wallet deduction
* Order records
* Number assignment
* Purchase failure

### Active Numbers

Handles:

* Purchased numbers
* Status
* OTP count
* Expiry
* Manual OTP check

### OTP

Handles:

* Vendor message checks
* OTP extraction
* Duplicate prevention
* OTP history

### Refunds

Handles:

* Refund eligibility
* Refund requests
* Admin approval
* Wallet credit

### Admin

Handles:

* Users
* Top-ups
* Products
* Inventory
* Orders
* Refunds
* Announcements
* Settings

---

## 6. Top-Up Architecture

```
User opens Wallet
       |
       v
User opens Top-Up popup
       |
       v
Frontend loads payment accounts
       |
       v
User submits amount and payment details
       |
       v
Backend creates PENDING request
       |
       v
Frontend opens WhatsApp admin message
       |
       v
Admin verifies payment
       |
       v
Admin approves request
       |
       v
Backend credits wallet and creates transaction
```

Top-up approval and wallet credit must run in one database transaction.

---

## 7. Number Purchase Architecture

```
User selects product
       |
       v
Backend reads price and stock
       |
       v
Backend checks wallet
       |
       v
Database transaction starts
       |
       v
Order is created
       |
       v
Wallet amount is deducted
       |
       v
Number is assigned or purchased
       |
       v
Purchased number is saved
       |
       v
Wallet transaction is saved
       |
       v
Transaction completes
```

If the purchase fails, the backend must safely restore the wallet balance or create a refund transaction.

---

## 8. OTP Architecture

### Manual Check

```
User clicks Check OTP
       |
       v
Backend checks number ownership
       |
       v
Backend calls vendor API
       |
       v
New message is saved
       |
       v
OTP is extracted
       |
       v
Frontend receives updated result
```

### Automatic Check

```
Background worker
       |
       v
Gets waiting numbers
       |
       v
Calls vendor API
       |
       v
Saves new messages
       |
       v
Updates OTP count and number status
```

Automatic polling can be added after the basic application works.

---

## 9. Security

Apply these rules:

* Never expose vendor keys
* Never trust frontend prices
* Never allow users to access other users' data
* Use database transactions for wallet changes
* Validate all input
* Protect admin routes
* Do not log passwords, access tokens, OTPs, or payment details
* Keep secrets in environment variables
* Add rate limits to login and OTP check endpoints
* Keep audit logs for admin financial actions

---

## 10. Deployment

Simple deployment:

```
Frontend: Vercel
Backend: Railway, Render, VPS, or similar service
Database: Managed PostgreSQL
Worker: Same backend server or separate worker process
```

The backend should provide:

```
GET /health
```

This endpoint should return the backend and database status.
