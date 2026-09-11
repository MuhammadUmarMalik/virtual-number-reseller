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

## 22. Exchange Rates

Public — no auth required.

```
GET /api/v1/exchange-rates
```

Returns the latest USD-based exchange rates cached from `https://open.er-api.com/v6/latest/USD`.

**Response**

```json
{
  "success": true,
  "message": "Exchange rates retrieved",
  "data": {
    "rates": { "USD": 1, "PKR": 278.5, "INR": 83.2, "GBP": 0.79, "EUR": 0.92 },
    "updatedAt": "2026-08-13T10:00:00.000Z"
  }
}
```

**Behaviour**

* Rates are refreshed by a background job (`sync-exchange-rates`) every 6–12 hours.
* If the external API is unreachable or returns `result !== "success"`, the last known rates are returned and a warning is logged.
* Prices are stored and charged in PKR and displayed converted into the selected currency at runtime; converted prices are never stored.

**Top-up requests**

Top-up amounts are entered and stored in PKR. `currency` and `displayAmount` are optional audit fields recording the currency the user entered an amount in and the value as entered.

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


Vendor API — Durian RCS

Base URL: `https://api.durianrcs.com/out/ext_api/`

Auth: every request requires `name` (username) and `ApiKey`, sent as query params.

Response format:

```json
{ "code": 200, "msg": "Success", "data": "" }
```

---

## 1. Get User Info

`GET /getUserInfo`

**Params**


| Param  | Required | Description |
| ------ | -------- | ----------- |
| name   | Yes      | Username    |
| ApiKey | Yes      | API token   |

**Response**

```json
{
  "code": 200,
  "msg": "Success",
  "data": { "username": "admin", "score": 100, "create_date": "2018-05-09 11:18:35" }
}
```

**Codes:**`200` Success · `800` Account blocked · `802` Invalid username/ApiKey · `803` Missing username/ApiKey

---

## 2.1 Get/Occupy Phone Number

`GET /getMobile`

**Params**


| Param       | Required | Description                                                         |
| ----------- | -------- | ------------------------------------------------------------------- |
| name        | Yes      | Username                                                            |
| ApiKey      | Yes      | API token                                                           |
| cuy         | No       | Country code (2 digits), default: all                               |
| pex         | No       | Number prefix filter — country code + prefix, 1–6 digits          |
| pid         | Yes      | Project ID                                                          |
| num         | Yes      | Quantity (1–10)                                                    |
| noblack     | Yes      | `0`filter own blacklist only,`1`filter all users' blacklists        |
| serial      | Yes      | `1`multiple,`2`single — must match`getMsg`/`passMobile`calls later |
| secret\_key | No       | Only required for select projects                                   |
| vip         | No       | VIP exclusive channel                                               |

**Response (single)**

```json
{ "code": 200, "msg": "Success", "data": "+59173841704" }
```

**Response (multiple)**

```json
{ "code": 200, "msg": "Success", "data": ["+59173841704", "+59173841704"] }
```

**Codes:**`200` Success · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `902` Invalid parameter · `903` Invalid country code · `904` Invalid project ID · `906` Number list empty · `907` Invalid VIP key · `400` System exception · `403` Insufficient credits · `406` 24h new-number cap reached · `409` Rate limited · `400101` Secret key required · `400102` Parameter not open · `400103` Invalid secret key · `400906` Invalid serial parameter · `200408` Number card limit reached

---

## 2.2 Get/Occupy Phone Number + Country Code

`GET /getMobileCode`

Same params as 2.1. Only difference is response includes country code alongside number.

**Response (single)**

```json
{ "code": 200, "msg": "Success", "data": "+59173841704,+591" }
```

**Response (multiple)**

```json
{ "code": 200, "msg": "Success", "data": ["+59173841704,+591", "+59173841704,+591"] }
```

Same error codes as 2.1.

---

## 3. Get Verification Code

`GET /getMsg`

**Params**


| Param  | Required | Description                                        |
| ------ | -------- | -------------------------------------------------- |
| name   | Yes      | Username                                           |
| ApiKey | Yes      | API token                                          |
| pid    | Yes      | Project ID                                         |
| pn     | Yes      | Phone number                                       |
| serial | Yes      | Must match value used in`getMobile`for this number |

**Response (single)**

```json
{ "code": 200, "msg": "Success", "data": "123456" }
```

**Response (multiple — semicolon-delimited string, not JSON array)**

```json
{ "code": 407, "msg": "Access to all SMS, API requests refresh and retry", "data": "Project name:123456;Project name:123456;" }
```

**Codes:**`200` Success · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `904` Invalid project ID · `905` Invalid number · `908` SMS not found, retry later · `405` Failed to receive SMS · `407` Refresh and retry · `400906` Invalid serial parameter

**Polling rule:** call every 15 seconds. Number valid for 5 minutes. `serial` must match the value used when the number was obtained, or this returns `405`.

---

## 4. Release Phone Number

`GET /passMobile`

**Params**


| Param  | Required | Description                 |
| ------ | -------- | --------------------------- |
| name   | Yes      | Username                    |
| ApiKey | Yes      | API token                   |
| pid    | Yes      | Project ID                  |
| pn     | Yes      | Phone number                |
| serial | Yes      | Must match original request |

**Response**

```json
{ "code": 200, "msg": "Success", "data": "" }
```

**Codes:**`200` Success · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `401` Invalid operation · `904` Invalid project ID · `905` Invalid number · `400906` Invalid serial parameter

Not required if SMS was received successfully.

---

## 5. Add Phone Number to Blacklist

`GET /addBlack`

**Params**


| Param  | Required | Description  |
| ------ | -------- | ------------ |
| name   | Yes      | Username     |
| ApiKey | Yes      | API token    |
| pid    | Yes      | Project ID   |
| pn     | Yes      | Phone number |

**Response**

```json
{ "code": 200, "msg": "Success", "data": 1 }
```

**Codes:**`200` Success · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `400` System exception · `904` Invalid project ID · `905` Invalid number · `912` Duplicate blacklist entry

Only blacklist when: SMS received (confirm valid number) is not needed — only blacklist on failure (no SMS after repeated tries) or known-bad number. Over-blacklisting reduces future number availability.

---

## 6. Query Phone Number Status

`GET /getStatus`

**Params**


| Param  | Required | Description  |
| ------ | -------- | ------------ |
| name   | Yes      | Username     |
| ApiKey | Yes      | API token    |
| pid    | Yes      | Project ID   |
| pn     | Yes      | Phone number |

**Response**

```json
{ "code": 203, "msg": "The number is not occupied and no SMS is received", "data": "" }
```

**Codes:**`200` Success · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `904` Invalid project ID · `905` Invalid number · `201` SMS received · `202` Occupied, no SMS yet · `203` Not occupied, no SMS

---

## 7. Query Blacklist Status

`GET /getBlack`

**Params**


| Param  | Required | Description  |
| ------ | -------- | ------------ |
| name   | Yes      | Username     |
| ApiKey | Yes      | API token    |
| pid    | Yes      | Project ID   |
| pn     | Yes      | Phone number |

**Response**

```json
{ "code": 200100, "msg": "Blacklist added successfully", "data": "" }
```

**Codes:**`200100` Confirmed on blacklist · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `904` Invalid project ID · `905` Invalid number · `902` Invalid parameter · `400100` Not on blacklist

---

## 8. Query Country Distribution & Stock

`GET /getCountryPhoneNum`

**Params**


| Param  | Required | Description           |
| ------ | -------- | --------------------- |
| name   | Yes      | Username              |
| ApiKey | Yes      | API token             |
| pid    | No       | Project ID            |
| vip    | No       | VIP exclusive channel |

**Response**

```json
{ "code": 200, "msg": "Success", "data": { "th": 2, "id": 1, "in": 1 } }
```

Keys are country codes, values are available quantity.

**Codes:**`200` Success · `403` No data · `800` Blocked · `802` Invalid credentials · `803` Missing credentials · `907` Invalid VIP key

---

## Integration Notes

* **`serial` consistency**: value used in `getMobile`/`getMobileCode` must be reused in `getMsg` and `passMobile` for the same number, or requests fail with `405`/`400906`. Store `serial` per number in `number_inventory`.
* **Polling**: `getMsg` has no webhook — poll every 15s, stop after 5 min (auto-expiry) or on success.
* **Multi-number `getMsg` response** is a semicolon-delimited string, not JSON — needs custom parsing, not `JSON.parse`.
* **Blacklisting**: only call `addBlack` after repeated failed OTP attempts or a confirmed bad number — frequent blacklisting lowers future number quality/availability.
* **Vendor credits (`score`)** are separate from app user wallets — track vendor balance independently, likely on the admin dashboard.
* **`secret_key`**: required only for specific `pid`s — store as optional field per product in admin config.
* **Daily caps (`406`, `200408`)**: account-tier limits, not per-request errors to expose to end users — surface as "temporarily unavailable."
