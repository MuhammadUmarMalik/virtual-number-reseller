# API Endpoints

## Base URL

```
/api/v1
```

All protected endpoints require a valid access token.

---

## 1. Authentication

### Sign Up

```
POST /api/v1/auth/sign-up
```

Request:

```
{
  "fullName": "Muhammad Umar",
  "email": "umar@example.com",
  "whatsappNumber": "03000000000",
  "password": "StrongPassword123"
}
```

### Sign In

```
POST /api/v1/auth/sign-in
```

Request:

```
{
  "email": "umar@example.com",
  "password": "StrongPassword123"
}
```

### Current User

```
GET /api/v1/auth/me
```

### Refresh Token

```
POST /api/v1/auth/refresh
```

### Logout

```
POST /api/v1/auth/logout
```

### Forgot Password

```
POST /api/v1/auth/forgot-password
```

### Reset Password

```
POST /api/v1/auth/reset-password
```

---

## 2. Dashboard

### Get Dashboard Data

```
GET /api/v1/dashboard
```

Returns:

* Wallet balance
* Total orders
* Active numbers
* OTP count
* Available products
* Recent orders

---

## 3. Products

### Get Products

```
GET /api/v1/products
```

Optional filters:

```
country
service
numberType
status
page
limit
```

### Get Product Details

```
GET /api/v1/products/:productId
```

---

## 4. Orders

### Create Order

```
POST /api/v1/orders
```

Request:

```
{
  "productId": "product_id",
  "quantity": 1
}
```

The backend must:

1. Read the product price from the database.
2. Check the wallet balance.
3. Check stock.
4. Deduct the amount.
5. Create the order.
6. Assign or purchase the number.

### Get User Orders

```
GET /api/v1/orders
```

### Get Order Details

```
GET /api/v1/orders/:orderId
```

### Request Order Refund

```
POST /api/v1/orders/:orderId/refund
```

Request:

```
{
  "reason": "Number did not receive OTP"
}
```

---

## 5. Active Numbers

### Get Active Numbers

```
GET /api/v1/numbers
```

### Get Number Details

```
GET /api/v1/numbers/:numberId
```

### Check OTP Manually

```
POST /api/v1/numbers/:numberId/check-otp
```

The backend must verify that the number belongs to the logged-in user.

---

## 6. OTP History

### Get OTP History

```
GET /api/v1/otp-history
```

Optional filters:

```
number
service
dateFrom
dateTo
page
limit
```

### Get OTP Details

```
GET /api/v1/otp-history/:otpId
```

---

## 7. Wallet

### Get Wallet

```
GET /api/v1/wallet
```

Returns:

* Current balance
* Total deposits
* Total purchases
* Total refunds

### Get Wallet Transactions

```
GET /api/v1/wallet/transactions
```

Optional filters:

```
type
status
dateFrom
dateTo
page
limit
```

---

## 8. Wallet Top-Up

### Get Payment Accounts

```
GET /api/v1/topups/payment-accounts
```

Returns active JazzCash, Easypaisa, or bank details.

### Create Top-Up Request

```
POST /api/v1/topups
```

Request:

```
{
  "paymentAccountId": "account_id",
  "amount": 1000,
  "senderAccount": "03000000000",
  "transactionId": "TXN-12345",
  "screenshotUrl": "optional-file-url",
  "notes": "Payment sent"
}
```

Response includes the WhatsApp URL for sending the request to the admin.

### Get User Top-Up Requests

```
GET /api/v1/topups
```

### Get Top-Up Details

```
GET /api/v1/topups/:topupId
```

### Cancel Pending Top-Up

```
POST /api/v1/topups/:topupId/cancel
```

---

## 9. Refunds

### Create Refund Request

```
POST /api/v1/refunds
```

Request:

```
{
  "orderId": "order_id",
  "reason": "OTP not received"
}
```

### Get Refund Requests

```
GET /api/v1/refunds
```

### Get Refund Details

```
GET /api/v1/refunds/:refundId
```

---

## 10. Updates and Notifications

### Get Announcements

```
GET /api/v1/announcements
```

### Get Notifications

```
GET /api/v1/notifications
```

### Mark Notification as Read

```
PATCH /api/v1/notifications/:notificationId/read
```

### Mark All Notifications as Read

```
PATCH /api/v1/notifications/read-all
```

---

## 11. User Settings

### Get Profile

```
GET /api/v1/users/profile
```

### Update Profile

```
PATCH /api/v1/users/profile
```

### Change Password

```
PATCH /api/v1/users/password
```

### Get Active Sessions

```
GET /api/v1/users/sessions
```

### Remove Session

```
DELETE /api/v1/users/sessions/:sessionId
```

---

# Admin Endpoints

All admin endpoints require authentication and the `<span>ADMIN</span>` role.

## 12. Admin Dashboard

```
GET /api/v1/admin/dashboard
```

Returns:

* Total users
* Total orders
* Pending top-ups
* Pending refunds
* Total deposits
* Total purchases
* Available stock

---

## 13. Admin Users

```
GET   /api/v1/admin/users
GET   /api/v1/admin/users/:userId
PATCH /api/v1/admin/users/:userId/status
```

### Manual Wallet Credit

```
POST /api/v1/admin/users/:userId/wallet/credit
```

### Manual Wallet Debit

```
POST /api/v1/admin/users/:userId/wallet/debit
```

Every manual adjustment must create a wallet transaction and audit log.

---

## 14. Admin Top-Ups

```
GET /api/v1/admin/topups
GET /api/v1/admin/topups/:topupId
```

### Approve Top-Up

```
POST /api/v1/admin/topups/:topupId/approve
```

### Reject Top-Up

```
POST /api/v1/admin/topups/:topupId/reject
```

Request:

```
{
  "reason": "Payment could not be verified"
}
```

---

## 15. Admin Payment Accounts

```
GET    /api/v1/admin/payment-accounts
POST   /api/v1/admin/payment-accounts
PATCH  /api/v1/admin/payment-accounts/:accountId
DELETE /api/v1/admin/payment-accounts/:accountId
```

---

## 16. Admin Products

```
GET    /api/v1/admin/products
POST   /api/v1/admin/products
GET    /api/v1/admin/products/:productId
PATCH  /api/v1/admin/products/:productId
DELETE /api/v1/admin/products/:productId
```

---

## 17. Admin Inventory

```
GET   /api/v1/admin/inventory
POST  /api/v1/admin/inventory
POST  /api/v1/admin/inventory/bulk-upload
PATCH /api/v1/admin/inventory/:numberId
```

---

## 18. Admin Orders

```
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId
POST /api/v1/admin/orders/:orderId/retry
POST /api/v1/admin/orders/:orderId/cancel
POST /api/v1/admin/orders/:orderId/refund
```

---

## 19. Admin Refunds

```
GET  /api/v1/admin/refunds
GET  /api/v1/admin/refunds/:refundId
POST /api/v1/admin/refunds/:refundId/approve
POST /api/v1/admin/refunds/:refundId/reject
```

---

## 20. Admin Announcements

```
GET    /api/v1/admin/announcements
POST   /api/v1/admin/announcements
PATCH  /api/v1/admin/announcements/:announcementId
DELETE /api/v1/admin/announcements/:announcementId
```

---

## 21. Admin Settings

```
GET   /api/v1/admin/settings
PATCH /api/v1/admin/settings
```

---

## Common Success Response

```
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

## Common Error Response

```
{
  "success": false,
  "message": "Request failed",
  "errors": []
}
```
