# User Flow

## 1. Sign Up Flow

```
User opens Sign Up
       |
       v
User enters name, email, WhatsApp number, and password
       |
       v
Frontend validates the form
       |
       v
Backend checks duplicate email and WhatsApp number
       |
       v
Password is hashed
       |
       v
User account and wallet are created
       |
       v
User is redirected to Sign In or Dashboard
```

---

## 2. Sign In Flow

```
User opens Sign In
       |
       v
User enters email and password
       |
       v
Backend verifies account and password
       |
       v
Access token and refresh token are created
       |
       v
User opens Dashboard
```

Blocked or suspended users cannot sign in.

---

## 3. Dashboard Flow

The Dashboard shows:

* Wallet balance
* Available number products
* Product price
* Available stock
* Recent orders
* Recent active numbers
* OTP count

```
User opens Dashboard
       |
       v
Frontend loads dashboard API
       |
       v
User selects a product
       |
       v
User selects quantity
       |
       v
User clicks Buy
```

If the wallet balance is low, the user is sent to the Wallet page.

---

## 4. Wallet Top-Up Flow

```
User opens Wallet
       |
       v
User clicks Top Up
       |
       v
Popup shows JazzCash, Easypaisa, or bank account details
       |
       v
User sends payment
       |
       v
User enters amount, sender account, and transaction ID
       |
       v
User submits request
       |
       v
Backend creates a PENDING top-up request
       |
       v
WhatsApp opens with a prepared message
       |
       v
User sends the message to admin
```

The wallet balance does not change at this stage.

---

## 5. Admin Top-Up Approval Flow

```
Admin opens Top-Up Requests
       |
       v
Admin reviews payment details
       |
       v
Admin verifies the payment
       |
       v
Admin approves or rejects the request
```

### When Approved

```
Request status becomes APPROVED
       |
       v
Wallet balance increases
       |
       v
Deposit transaction is created
       |
       v
User receives notification
```

### When Rejected

```
Request status becomes REJECTED
       |
       v
Rejection reason is saved
       |
       v
User receives notification
```

---

## 6. Number Purchase Flow

```
User selects a product
       |
       v
User clicks Buy
       |
       v
Backend reads product price from database
       |
       v
Backend checks stock
       |
       v
Backend checks wallet balance
       |
       v
Order is created
       |
       v
Wallet amount is deducted
       |
       v
Number is assigned from inventory or vendor API
       |
       v
Purchased number is saved
       |
       v
User sees the number in Active Numbers
```

### If Purchase Fails

```
Order becomes FAILED
       |
       v
Wallet deduction is reversed or refunded
       |
       v
User receives failure notification
```

---

## 7. Active Numbers Flow

The Active Numbers page shows:

* Phone number
* Service
* Status
* OTP count
* Purchase time
* Expiry time
* Check OTP button
* Copy number button

```
User opens Active Numbers
       |
       v
Frontend loads purchased numbers
       |
       v
User copies a number or checks OTP
```

---

## 8. OTP Flow

### Manual OTP Check

```
User clicks Check OTP
       |
       v
Backend verifies number ownership
       |
       v
Backend requests messages from vendor API
       |
       v
New message is saved
       |
       v
OTP is extracted
       |
       v
OTP count and status are updated
       |
       v
User sees the OTP
```

### Automatic OTP Check

```
Background worker checks waiting numbers
       |
       v
Vendor API returns new message
       |
       v
Message and OTP are saved
       |
       v
Number status becomes RECEIVED
       |
       v
User receives notification
```

---

## 9. OTP History Flow

```
User opens OTP History
       |
       v
Frontend loads OTP records
       |
       v
User can filter by number, service, or date
       |
       v
User copies OTP or views the full message
```

Users can only see OTPs linked to their own purchased numbers.

---

## 10. My Orders Flow

The Orders page shows:

* Order code
* Service
* Quantity
* Unit price
* Total
* OTP count
* Status
* Date

```
User opens My Orders
       |
       v
Frontend loads user orders
       |
       v
User opens an order
       |
       v
User views numbers, OTP count, price, and status
```

---

## 11. Refund Flow

```
User opens an eligible order
       |
       v
User clicks Request Refund
       |
       v
User enters a reason
       |
       v
Backend checks refund time and order status
       |
       v
Refund request is created
       |
       v
Admin reviews the request
```

### Approved Refund

```
Refund becomes APPROVED
       |
       v
Wallet is credited
       |
       v
REFUND transaction is created
       |
       v
Order becomes REFUNDED
       |
       v
User receives notification
```

### Rejected Refund

```
Refund becomes REJECTED
       |
       v
Admin reason is saved
       |
       v
User receives notification
```

---

## 12. Updates Flow

```
Admin creates announcement
       |
       v
Admin publishes announcement
       |
       v
User opens Updates page
       |
       v
User sees stock, price, maintenance, or service updates
```

The page also contains:

* Contact Admin
* WhatsApp support
* Official updates channel

---

## 13. Settings Flow

```
User opens Settings
       |
       v
User updates profile or password
       |
       v
Frontend validates data
       |
       v
Backend saves changes
       |
       v
User receives success message
```

Settings include:

* Name
* Email
* WhatsApp number
* Password
* Notification preferences
* Active sessions

---

## 14. Admin Product Flow

```
Admin opens Products
       |
       v
Admin creates or edits a product
       |
       v
Admin sets country, service, price, stock, and refund time
       |
       v
Product becomes available on Dashboard
```

---

## 15. Admin Inventory Flow

```
Admin opens Inventory
       |
       v
Admin adds one number or uploads a CSV
       |
       v
Number is linked to a product
       |
       v
Status becomes AVAILABLE
       |
       v
User purchase reserves and sells the number
```

---

## 16. Complete App Flow

```
Sign Up
  |
  v
Sign In
  |
  v
Dashboard
  |
  v
Wallet Top-Up
  |
  v
Admin Approval
  |
  v
Wallet Credit
  |
  v
Buy Number
  |
  v
Active Numbers
  |
  v
OTP Received
  |
  v
OTP History
  |
  v
Order Completed
```

If no OTP is received and the refund rules allow it:

```
Refund Request
  |
  v
Admin Review
  |
  v
Wallet Refund
```
