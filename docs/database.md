# Database

## 1. Database Choice

Use PostgreSQL with Prisma ORM.

Use `<span>Decimal</span>` for all money values.

Do not use JavaScript floating-point values for wallet balances or prices.

---

## 2. Main Tables

```
users
sessions
wallets
wallet_transactions
payment_accounts
topup_requests
vendors
products
inventory_numbers
orders
order_items
purchased_numbers
otp_messages
refund_requests
notifications
announcements
app_settings
audit_logs
```

---

## 3. User

Stores user and admin accounts.

```
users
-----
id
full_name
email
whatsapp_number
password_hash
role
status
avatar_url
email_verified
last_login_at
created_at
updated_at
```

### Role Values

```
USER
ADMIN
```

### Status Values

```
ACTIVE
SUSPENDED
BLOCKED
```

Relations:

* One user has one wallet
* One user has many orders
* One user has many top-up requests
* One user has many purchased numbers
* One user has many OTP messages

---

## 4. Session

Stores refresh-token sessions.

```
sessions
--------
id
user_id
refresh_token
user_agent
ip_address
expires_at
created_at
```

A user can log in on multiple devices.

---

## 5. Wallet

Stores the current user balance.

```
wallets
-------
id
user_id
balance
created_at
updated_at
```

Rules:

* One wallet belongs to one user
* Balance cannot be negative
* Balance changes must create a wallet transaction

---

## 6. Wallet Transaction

Stores every wallet credit and debit.

```
wallet_transactions
-------------------
id
wallet_id
user_id
type
amount
balance_before
balance_after
status
reference_type
reference_id
description
created_by
created_at
```

### Transaction Types

```
DEPOSIT
PURCHASE
REFUND
ADJUSTMENT_CREDIT
ADJUSTMENT_DEBIT
REVERSAL
```

### Transaction Status

```
PENDING
COMPLETED
FAILED
REVERSED
```

Never delete wallet transactions.

---

## 7. Payment Account

Stores admin payment details.

```
payment_accounts
----------------
id
title
account_name
account_number
payment_method
instructions
is_active
created_at
updated_at
```

### Payment Methods

```
JAZZCASH
EASYPAISA
BANK_TRANSFER
```

---

## 8. Top-Up Request

Stores user payment requests.

```
topup_requests
--------------
id
request_code
user_id
payment_account_id
amount
sender_account
transaction_id
screenshot_url
notes
status
reviewed_by
reviewed_at
rejection_reason
created_at
updated_at
```

### Status Values

```
PENDING
UNDER_REVIEW
APPROVED
REJECTED
CANCELLED
```

Rules:

* A request can only be approved once
* Approval must create a deposit transaction
* Admin ID and review time must be saved

---

## 9. Vendor

Stores number provider details.

```
vendors
-------
id
name
api_base_url
encrypted_api_key
balance
is_active
created_at
updated_at
```

Vendor secrets must stay encrypted and must never be sent to the frontend.

---

## 10. Product

Stores number products sold to users.

```
products
--------
id
vendor_id           -- Durian project ID (PID) this product buys from
name
slug
country
country_code
service             -- platform (e.g. Facebook)
number_type
description
vendor_cost
selling_price
refund_window_hours
available_stock
serial_mode         -- SINGLE (serial=2) | MULTIPLE (serial=1) per vendor project
secret_key          -- required only for select vendor projects (never sent to users)
vip                 -- optional VIP exclusive channel key
status
created_at
updated_at
```

### Product Status

```
ACTIVE
INACTIVE
OUT_OF_STOCK
```

Example product:

```
Name: FB USA SIM Numbers
Country: United States
Service: Facebook
Number Type: SIM
Selling Price: 55 PKR
Refund Window: 3 hours
```

Vendor cost must not be shown to users.

---

## 11. Inventory Number

Stores numbers manually uploaded by admin or synced from a vendor.

```
inventory_numbers
-----------------
id
product_id
vendor_id
phone_number
vendor_number_id
api_url
encrypted_token
status
expires_at
created_at
updated_at
```

### Inventory Status

```
AVAILABLE
RESERVED
SOLD
EXPIRED
DISABLED
```

---

## 12. Order

Stores the main purchase record.

```
orders
------
id
order_code
user_id
subtotal
total
status
failure_reason
completed_at
created_at
updated_at
```

### Order Status

```
PENDING
PROCESSING
ACTIVE
WAITING_OTP
OTP_RECEIVED
COMPLETED
REFUND_PENDING
REFUNDED
FAILED
EXPIRED
```

---

## 13. Order Item

Stores each product inside an order.

```
order_items
-----------
id
order_id
product_id
quantity
unit_price
total_price
status
otp_count
created_at
```

One order can contain one or more items.

---

## 14. Purchased Number

Stores numbers assigned to a user.

```
purchased_numbers
-----------------
id
user_id
order_id
order_item_id
product_id
vendor_id
phone_number
api_url
encrypted_token
vendor_order_id
status
otp_count
poll_attempts
purchased_at
expires_at
last_checked_at
created_at
updated_at
```

Rules:

* `poll_attempts` counts `getMsg` polls for the number (incremented by the OTP polling job / manual check).
* `last_checked_at` throttles polling to once per `OTP_POLLING_INTERVAL_MS` (default 15s); rows are also skipped once past `expires_at`.

### Number Status

```
WAITING
ACTIVE
RECEIVED
EXPIRED
REFUNDED
DISABLED
```

Rules:

* Number must belong to one user
* Number must belong to one order
* Private vendor tokens must not be shown directly

---

## 15. OTP Message

Stores received messages and extracted OTP codes.

```
otp_messages
------------
id
user_id
purchased_number_id
vendor_message_id
service
raw_message
otp_code
message_hash
received_at
created_at
```

Rules:

* Store the original message
* Store the extracted OTP separately
* Use message hash or vendor message ID to prevent duplicates
* Only the owner and admin can view the OTP

---

## 16. Refund Request

Stores refund claims.

```
refund_requests
---------------
id
user_id
order_id
reason
status
amount
reviewed_by
reviewed_at
admin_notes
created_at
updated_at
```

### Refund Status

```
PENDING
APPROVED
REJECTED
COMPLETED
```

Refund approval must create a wallet refund transaction.

---

## 17. Notification

Stores user notifications.

```
notifications
-------------
id
user_id
title
message
type
is_read
created_at
```

Example notifications:

* Top-up approved
* Top-up rejected
* OTP received
* Refund approved
* Order failed

---

## 18. Announcement

Stores updates shown on the Updates page.

```
announcements
-------------
id
title
message
type
is_published
published_at
expires_at
created_by
created_at
updated_at
```

### Announcement Types

```
GENERAL
STOCK
PRICE_UPDATE
MAINTENANCE
SERVICE_ISSUE
```

---

## 19. App Setting

Stores simple system settings.

```
app_settings
------------
id
key
value
created_at
updated_at
```

Example keys:

```
minimum_topup_amount
admin_whatsapp_number
support_whatsapp_number
otp_polling_interval
```

---

## 20. Audit Log

Stores admin and financial actions.

```
audit_logs
----------
id
user_id
admin_id
action
entity_type
entity_id
old_value
new_value
ip_address
created_at
```

Use audit logs for:

* Top-up approval
* Top-up rejection
* Manual wallet credit
* Manual wallet debit
* Refund approval
* Product price change
* User status change

---

## 21. Main Relationships

```
User
  ├── Wallet
  ├── Sessions
  ├── Top-Up Requests
  ├── Orders
  ├── Purchased Numbers
  ├── OTP Messages
  ├── Refund Requests
  └── Notifications

Wallet
  └── Wallet Transactions

Product
  ├── Inventory Numbers
  ├── Order Items
  └── Purchased Numbers

Order
  ├── Order Items
  ├── Purchased Numbers
  └── Refund Requests

Purchased Number
  └── OTP Messages
```

---

## 22. Important Database Rules

1. Use database transactions for wallet credits and debits.
2. Do not allow negative wallet balances.
3. Do not delete financial records.
4. Prevent duplicate top-up approvals.
5. Prevent duplicate refunds.
6. Prevent duplicate OTP messages.
7. Keep product prices in the database.
8. Keep vendor keys encrypted.
9. Add indexes on user ID, status, order ID, and created date.
10. Use migrations for all schema changes.
