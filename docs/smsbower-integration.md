# SMSBower Vendor Integration Documentation

## 1. Purpose

This document is the implementation reference for integrating
**SMSBower** as a second number/OTP vendor into the existing Number
Reseller application.

It is written so that a developer or coding agent can use this file as
project context without repeatedly reading the external vendor
documentation.

**Official source:** https://smsbower.app/api/?page=client

> Source scope: This document records the SMSBower client API documented
> on the official client API page. It does not invent undocumented
> behavior. Where an application-level design is recommended, it is
> explicitly marked as a recommendation.

------------------------------------------------------------------------

# 2. Vendor Overview

SMSBower provides APIs for automating:

-   phone-number acquisition
-   SMS/OTP receiving
-   activation status management
-   prices
-   services/projects
-   countries
-   provider-level pricing
-   vendor balance
-   webhook-based SMS notifications

The official documentation states that all API requests use:

``` text
https://smsbower.page/stubs/handler_api.php
```

and can use either GET or POST.

Every request must include:

``` text
api_key
```

as the API authentication parameter.

Source: official SMSBower API documentation.

------------------------------------------------------------------------

# 3. Base URLs

## Main API

``` text
https://smsbower.page/stubs/handler_api.php
```

## Static wallet endpoint

``` text
https://smsbower.page/api/payment/getActualWalletAddress
```

## Webhook

Webhook URL is configured in the SMSBower profile/settings.

Example application endpoint:

``` text
POST https://your-domain.com/api/webhooks/smsbower
```

------------------------------------------------------------------------

# 4. Authentication

SMSBower uses:

``` text
api_key
```

Example:

``` text
api_key=YOUR_SMSBOWER_API_KEY
```

Store it only on the backend.

Recommended environment variables:

``` env
SMSBOWER_BASE_URL=https://smsbower.page
SMSBOWER_API_KEY=your_api_key
SMSBOWER_WEBHOOK_ENABLED=true
```

Never expose `SMSBOWER_API_KEY` to the frontend.

------------------------------------------------------------------------

# 5. API Response Style

SMSBower does not use one universal JSON response format for all
endpoints.

Different operations return different formats.

Examples:

``` text
ACCESS_BALANCE:100.50
```

``` text
ACCESS_NUMBER:activationId:phoneNumber
```

``` text
STATUS_WAIT_CODE
```

``` text
STATUS_OK:123456
```

Some endpoints return JSON.

Your backend must normalize these vendor-specific responses before
exposing them to the application.

Recommended internal format:

``` ts
type VendorResult<T> = {
  success: boolean;
  data?: T;
  providerCode?: string;
  message?: string;
  retryable?: boolean;
};
```

Do not make frontend code depend directly on strings such as
`ACCESS_NUMBER` or `STATUS_OK`.

------------------------------------------------------------------------

# 6. Complete Vendor API Inventory

  ----------------------------------------------------------------------------------
  \#                Vendor operation  Action / endpoint            Application
                                                                   purpose
  ----------------- ----------------- ---------------------------- -----------------
  1                 Get Balance       `getBalance`                 Check vendor
                                                                   balance

  2                 Get Phone Number  `getNumber`                  Purchase number

  3                 Get SMS Code      `getStatus`                  Poll activation
                                                                   status / OTP

  4                 Change Activation `setStatus`                  Cancel, request
                    Status                                         another SMS,
                                                                   complete

  5                 Get Prices        `getPrices`                  Current
                                                                   country/service
                                                                   price + count

  6                 Services          `getServicesList`            Service/project
                                                                   catalog

  7                 Countries         `getCountries`               Country catalog

  8                 Top Countries     `getTopCountriesByService`   Top countries for
                                                                   service

  9                 Get Phone Number  `getNumberV2`                Purchase number +
                    V2                                             detailed
                                                                   activation data

  10                Prices V2         `getPricesV2`                Price-tier stock

  11                Prices V3         `getPricesV3`                Provider-level
                                                                   stock/pricing

  12                Static Wallet     `getActualWalletAddress`     Vendor payment
                                                                   wallet

  13                Webhook           Profile-configured URL       Receive SMS
                                                                   without polling
  ----------------------------------------------------------------------------------

------------------------------------------------------------------------

# 7. Endpoint 1 --- Get Balance

## Vendor request

``` http
GET https://smsbower.page/stubs/handler_api.php
```

Query:

``` text
api_key=YOUR_API_KEY
action=getBalance
```

Full example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getBalance
```

## Response

``` text
ACCESS_BALANCE:100.50
```

Meaning:

``` text
ACCESS_BALANCE:<vendor balance>
```

## Error

``` text
BAD_KEY
```

means the API key is invalid.

## Internal service

``` ts
getBalance(): Promise<VendorBalance>
```

Recommended normalized result:

``` json
{
  "success": true,
  "balance": 100.5,
  "currency": "USD"
}
```

------------------------------------------------------------------------

# 8. Endpoint 2 --- Get Phone Number

## Vendor request

``` http
GET/POST https://smsbower.page/stubs/handler_api.php
```

Action:

``` text
getNumber
```

Parameters:

``` text
api_key
action=getNumber
service
country
maxPrice
providerIds
exceptProviderIds
phoneException
ref
userID
minPrice
```

## Parameter details

### `service`

SMSBower service code.

Example:

``` text
go
```

The service list should be obtained using `getServicesList`.

### `country`

SMSBower country identifier/code.

Use `getCountries` as the source for available country data.

### `maxPrice`

Maximum price you are willing to pay.

Example:

``` text
maxPrice=0.50
```

### `minPrice`

Minimum price you are willing to pay.

### `providerIds`

Comma-separated provider IDs.

Example:

``` text
providerIds=1,2,3
```

### `exceptProviderIds`

Providers to exclude.

Example:

``` text
exceptProviderIds=4,7
```

### `phoneException`

Exclude number prefixes.

Documentation example:

``` text
7918,7900111
```

### `ref`

Referral ID.

### `userID`

Documented as a parameter for resellers. SMSBower says to contact
support for details.

Do not assume its semantics beyond the vendor documentation.

## Successful response

``` text
ACCESS_NUMBER:123456:+123456789
```

Format:

``` text
ACCESS_NUMBER:<activationId>:<phoneNumber>
```

## Errors

``` text
BAD_KEY
BAD_ACTION
BAD_SERVICE
```

## Internal mapping

Store:

``` text
vendor = SMSBOWER
vendor_activation_id = activationId
phone_number = phoneNumber
service = service
country = country
vendor_cost = actual vendor cost when available
```

------------------------------------------------------------------------

# 9. Endpoint 3 --- Get SMS / Activation Status

## Vendor request

``` http
GET/POST https://smsbower.page/stubs/handler_api.php
```

Query:

``` text
api_key=YOUR_API_KEY
action=getStatus
id=ACTIVATION_ID
```

Example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getStatus&id=123456
```

## Responses

### Waiting for first SMS

``` text
STATUS_WAIT_CODE
```

Internal status:

``` text
WAITING_FOR_SMS
```

### Waiting for another SMS

``` text
STATUS_WAIT_RETRY:<lastCode>
```

Internal status:

``` text
WAITING_FOR_NEXT_SMS
```

### Activation cancelled

``` text
STATUS_CANCEL
```

Internal status:

``` text
CANCELLED
```

### OTP received

``` text
STATUS_OK:123456
```

Internal:

``` text
status = SMS_RECEIVED
otp = 123456
```

## Errors

``` text
BAD_KEY
BAD_ACTION
NO_ACTIVATION
```

`NO_ACTIVATION` means the activation ID is invalid.

------------------------------------------------------------------------

# 10. Endpoint 4 --- Change Activation Status

## Vendor request

``` http
GET/POST https://smsbower.page/stubs/handler_api.php
```

Query:

``` text
api_key=YOUR_API_KEY
action=setStatus
status=STATUS
id=ACTIVATION_ID
```

Example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=setStatus&status=6&id=123456
```

## Supported status values

  Status   Meaning
  -------- ---------------------------------------------------
  `1`      Inform vendor that the number is ready / SMS sent
  `3`      Request another SMS code
  `6`      Complete activation
  `8`      Number was used; cancel activation

## Vendor responses

``` text
ACCESS_READY
```

Number is ready.

``` text
ACCESS_RETRY_GET
```

Waiting for another SMS.

``` text
ACCESS_ACTIVATION
```

Activation completed successfully.

``` text
ACCESS_CANCEL
```

Activation cancelled.

## Errors

``` text
NO_ACTIVATION
BAD_STATUS
BAD_KEY
BAD_ACTION
EARLY_CANCEL_DENIED
```

`EARLY_CANCEL_DENIED` means the number cannot be cancelled yet. The
documentation states cancellation is possible after 2 minutes following
purchase.

------------------------------------------------------------------------

# 11. Activation Lifecycle

The documented chronology is important.

## Initial purchase

``` text
getNumber / getNumberV2
```

After acquisition:

``` text
8 = cancel activation if number does not match
1 = report that SMS has been sent (optional)
```

After receiving the code:

``` text
3 = request another SMS
6 = confirm SMS and complete activation
```

Recommended application state flow:

``` text
PENDING_PURCHASE
      ↓
NUMBER_ACQUIRED
      ↓
WAITING_FOR_SMS
      ↓
SMS_RECEIVED
      ↓
COMPLETED
```

Alternative:

``` text
NUMBER_ACQUIRED
      ↓
NUMBER_INVALID
      ↓
CANCEL_REQUESTED
      ↓
CANCELLED
```

Another SMS:

``` text
SMS_RECEIVED
      ↓
REQUEST_ANOTHER_SMS
      ↓
WAITING_FOR_SMS
      ↓
SMS_RECEIVED
```

------------------------------------------------------------------------

# 12. Endpoint 5 --- Get Prices

## Request

``` text
action=getPrices
```

Parameters:

``` text
api_key
service
country
```

`service` is optional.

`country` is optional.

If omitted, the API returns broader pricing information.

## Example

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getPrices&service=go&country=2
```

## Response

JSON object structured around:

``` text
Country
  Service
    cost
    count
```

Example concept:

``` json
{
  "Country": {
    "Service": {
      "cost": 0.20,
      "count": 50
    }
  }
}
```

Use this endpoint for:

-   country/service availability
-   vendor cost
-   stock display
-   vendor routing

Do not expose raw vendor response directly to users.

------------------------------------------------------------------------

# 13. Endpoint 6 --- Get Services List

## Request

``` text
action=getServicesList
```

Example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getServicesList
```

## Response

``` json
{
  "status": "success",
  "services": [
    {
      "code": "kt",
      "name": "KakaoTalk"
    }
  ]
}
```

Store the service catalog in your database.

Recommended table:

``` text
vendor_services
```

Fields:

``` text
id
vendor
vendor_service_code
name
is_active
last_synced_at
```

------------------------------------------------------------------------

# 14. Endpoint 7 --- Get Countries

## Request

``` text
action=getCountries
```

Example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getCountries
```

## Response

The documented response contains country records such as:

``` json
{
  "id": 1003,
  "rus": "Бермуды",
  "eng": "Bermuda",
  "chn": "百慕大"
}
```

Store vendor-specific country IDs/codes separately from your internal
country IDs.

Recommended:

``` text
vendor_countries
```

Fields:

``` text
id
vendor
vendor_country_id
iso_code
name
is_active
```

Do not use SMSBower's numeric country ID as your global application
country primary key.

------------------------------------------------------------------------

# 15. Endpoint 8 --- Get Top Countries by Service

## Request

``` text
action=getTopCountriesByService
service=<service>
```

Example:

``` text
https://smsbower.page/stubs/handler_api.php?api_key=YOUR_API_KEY&action=getTopCountriesByService&service=go
```

The endpoint returns the top 10 countries for the requested service,
sorted by internal priority.

For each country, Gold-ranked partners are returned.

Example structure:

``` json
{
  "usa": {
    "3170": {
      "price": 0.12,
      "count": 542
    },
    "4120": {
      "price": 0.14,
      "count": 301
    }
  },
  "canada": {
    "2211": {
      "price": 0.11,
      "count": 190
    }
  }
}
```

Errors:

``` text
BAD_KEY
BAD_ACTION
BAD_SERVICE
```

Use this as an optimization/recommendation endpoint, not as the only
source of availability.

------------------------------------------------------------------------

# 16. Endpoint 9 --- Get Phone Number V2

## Recommended purchase endpoint

For the Number Reseller application, prefer:

``` text
getNumberV2
```

over the basic `getNumber` when the additional activation metadata is
useful.

## Request

Same general purchase parameters:

``` text
api_key
action=getNumberV2
service
country
maxPrice
providerIds
exceptProviderIds
userID
minPrice
```

## Response

``` json
{
  "activationId": "id",
  "phoneNumber": "number",
  "activationCost": "activationCost",
  "countryCode": "countryCode",
  "canGetAnotherSms": true,
  "activationTime": "activationTime",
  "activationOperator": "activationOperator"
}
```

This is useful because the application receives:

-   activation ID
-   phone number
-   activation cost
-   country code
-   ability to request another SMS
-   activation time
-   operator/provider information

Recommended database mapping:

``` text
vendor_activation_id
phone_number
vendor_cost
country_code
can_get_another_sms
activation_time
activation_operator
```

------------------------------------------------------------------------

# 17. Endpoint 10 --- Get Full Prices V2

## Request

``` text
action=getPricesV2
service=<service>
country=<country>
```

## Response concept

``` json
{
  "country": {
    "service": {
      "price1": 10,
      "price2": 20,
      "price3": 50
    }
  }
}
```

The keys represent price tiers and the values represent available
counts.

Use this for detailed stock/price analysis.

------------------------------------------------------------------------

# 18. Endpoint 11 --- Get Full Prices V3

## Request

``` text
action=getPricesV3
service=<service>
country=<country>
```

## Response concept

``` json
{
  "country": {
    "service": {
      "provider1": {
        "count": 100,
        "price": 0.20,
        "provider_id": 123
      },
      "provider2": {
        "count": 50,
        "price": 0.25,
        "provider_id": 456
      }
    }
  }
}
```

This is important for a multi-vendor/reseller platform because it
exposes provider-level count and pricing.

Recommended use:

``` text
Country + Service
       ↓
Provider availability
       ↓
Provider price
       ↓
Routing decision
```

Errors documented:

``` text
BAD_KEY
BAD_ACTION
BAD_SERVICE
BAD_COUNTRY
```

------------------------------------------------------------------------

# 19. Endpoint 12 --- Get Static Wallet Address

## Request

``` http
GET https://smsbower.page/api/payment/getActualWalletAddress
```

Parameters:

``` text
api_key
coin
network
```

Supported documented example:

``` text
coin=usdt
network=tron
```

Example:

``` text
https://smsbower.page/api/payment/getActualWalletAddress?api_key=YOUR_API_KEY&coin=usdt&network=tron
```

## Response

``` json
{
  "wallet_address": "TFGMAwTfxtxKvy1mTTHr7XJaXeumjdmhGg"
}
```

Use this only if your application needs to display or process the vendor
payment wallet.

Do not confuse this with the application's user wallet system.

------------------------------------------------------------------------

# 20. Webhook --- Incoming SMS

This is the most important SMSBower feature for realtime OTP delivery.

The official documentation says that after a number is acquired, there
is no need to constantly poll for incoming SMS if webhook notifications
are enabled.

Configure a webhook URL in the SMSBower profile.

Example:

``` text
POST https://your-domain.com/api/webhooks/smsbower
```

## Incoming payload

``` json
{
  "activationId": 123456,
  "service": "go",
  "text": "Sms text",
  "code": "12345",
  "country": 2,
  "receivedAt": "2023-01-01 12:00:00"
}
```

## Webhook source IP

The official documentation lists:

``` text
167.235.198.205
```

for activation/rental webhook requests.

Your infrastructure can whitelist this source IP if appropriate.

Do not treat IP filtering as the only security mechanism if SMSBower
later provides a signed webhook mechanism.

------------------------------------------------------------------------

# 21. Webhook Response Requirement

Your webhook must return:

``` http
200 OK
```

If your server does not respond successfully, SMSBower documents
retries:

``` text
First request
      ↓
failure
      ↓
retry after 1 minute
      ↓
failure
      ↓
retry after 5 minutes
```

After three unsuccessful attempts, SMSBower reports the webhook failure.

Therefore:

``` text
Webhook
  ↓
Validate
  ↓
Persist event
  ↓
Return 200 quickly
  ↓
Process asynchronously
```

is preferred.

Do not perform long-running vendor operations before returning the HTTP
response.

------------------------------------------------------------------------

# 22. Recommended Webhook Endpoint

Application endpoint:

``` http
POST /api/webhooks/smsbower
```

Expected flow:

``` text
SMSBower
   ↓
POST /api/webhooks/smsbower
   ↓
Validate source
   ↓
Validate payload
   ↓
Find activation
   ↓
Check vendor
   ↓
Deduplicate event
   ↓
Store SMS
   ↓
Update order
   ↓
Publish realtime event
   ↓
HTTP 200
```

Recommended event table:

``` text
vendor_webhook_events
```

Fields:

``` text
id
vendor
event_type
vendor_activation_id
payload
processed
processed_at
created_at
```

Add an idempotency/unique constraint around the appropriate vendor
event/activation identifiers.

------------------------------------------------------------------------

# 23. Realtime OTP Architecture

SMSBower:

``` text
SMSBower
   ↓
Webhook
   ↓
Backend
   ↓
PostgreSQL
   ↓
Redis / Event Bus
   ↓
WebSocket / Socket.IO
   ↓
Frontend
```

User experience:

``` text
Waiting for SMS...
        ↓
Webhook receives SMS
        ↓
OTP saved
        ↓
Frontend receives realtime event
        ↓
123456
```

The frontend should never need to call SMSBower directly.

------------------------------------------------------------------------

# 24. Polling Fallback

Even though webhook should be the primary mechanism, keep `getStatus`
available for:

-   webhook failure
-   reconciliation
-   delayed webhook
-   recovery
-   manual admin diagnostics

Recommended:

``` text
Primary:
SMSBower Webhook

Fallback:
getStatus
```

Do not continuously poll every activation if webhooks are working.

------------------------------------------------------------------------

# 25. Multi-Vendor Architecture

The application already supports DurianRCS.

Do not create a separate order architecture for SMSBower.

Use a vendor abstraction.

``` text
backend/
└── integrations/
    └── vendor/
        ├── vendor.interface.ts
        ├── vendor.factory.ts
        ├── vendor.types.ts
        │
        ├── durian/
        │   ├── durian.client.ts
        │   ├── durian.mapper.ts
        │   └── durian.types.ts
        │
        └── smsbower/
            ├── smsbower.client.ts
            ├── smsbower.mapper.ts
            └── smsbower.types.ts
```

------------------------------------------------------------------------

# 26. Recommended Vendor Interface

``` ts
interface NumberVendor {
  getBalance(): Promise<VendorBalance>;

  getServices(): Promise<VendorService[]>;

  getCountries(): Promise<VendorCountry[]>;

  getAvailability(
    params: AvailabilityParams
  ): Promise<VendorAvailability[]>;

  purchaseNumber(
    params: PurchaseParams
  ): Promise<VendorActivation>;

  getActivationStatus(
    activationId: string
  ): Promise<VendorActivationStatus>;

  cancelActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult>;

  requestAnotherSms(
    activation: VendorActivation
  ): Promise<VendorActionResult>;

  completeActivation(
    activation: VendorActivation
  ): Promise<VendorActionResult>;
}
```

Vendor-specific capabilities should not be faked.

For example, if Durian does not document a direct equivalent of
SMSBower's `requestAnotherSms`, the Durian adapter should report that
capability as unsupported rather than pretending it exists.

------------------------------------------------------------------------

# 27. Vendor Capability Matrix

  Capability                                           DurianRCS                        SMSBower
  ---------------------- --------------------------------------- -------------------------------
  Balance                                                    Yes                             Yes
  Acquire number                                             Yes                             Yes
  Get OTP                                                Polling               Webhook + polling
  Release/cancel                                             Yes       Yes via activation status
  Blacklist                                                  Yes   Not documented on client page
  Country availability                                       Yes       Yes via pricing endpoints
  Service catalog          Not documented in supplied Durian API                             Yes
  Provider selection       Not documented in supplied Durian API                             Yes
  Provider pricing         Not documented in supplied Durian API                             Yes
  Request another SMS      Not documented in supplied Durian API                             Yes
  Complete activation               Not documented as equivalent                             Yes
  Webhook                  Not documented in supplied Durian API                             Yes

------------------------------------------------------------------------

# 28. Internal Number Model

Recommended fields:

``` text
id
user_id
order_id

vendor
vendor_activation_id

phone_number
country_id
vendor_country_id

service_id
vendor_service_code

vendor_provider_id
vendor_operator

vendor_cost
selling_price
profit

status
vendor_status

activation_started_at
expires_at
completed_at

created_at
updated_at
```

------------------------------------------------------------------------

# 29. Order Model

Recommended fields:

``` text
id
user_id

vendor
vendor_activation_id

country_id
service_id

phone_number

vendor_cost
selling_price
profit

status

purchased_at
expires_at
completed_at

created_at
updated_at
```

------------------------------------------------------------------------

# 30. OTP Message Model

Recommended fields:

``` text
id
order_id
number_id

vendor
vendor_activation_id

service
country

code
message_text

received_at
source

created_at
```

`source`:

``` text
WEBHOOK
POLLING
ADMIN
```

------------------------------------------------------------------------

# 31. Vendor Account Model

Recommended:

``` text
vendor_accounts
```

Fields:

``` text
id
vendor
account_name
balance
currency
status
last_balance_sync_at
last_error
created_at
updated_at
```

Example:

``` json
{
  "vendor": "SMSBOWER",
  "balance": 125.50,
  "currency": "USD",
  "status": "ACTIVE"
}
```

------------------------------------------------------------------------

# 32. Vendor Configuration

Recommended:

``` env
SMSBOWER_BASE_URL=https://smsbower.page
SMSBOWER_API_KEY=...
SMSBOWER_WEBHOOK_ENABLED=true
```

Never store API keys in the database unless encrypted storage is
deliberately implemented.

------------------------------------------------------------------------

# 33. Vendor API Client

Recommended client structure:

``` ts
class SmsBowerClient {
  async getBalance() {}

  async getNumber(params) {}

  async getNumberV2(params) {}

  async getStatus(activationId) {}

  async setStatus(activationId, status) {}

  async getPrices(params) {}

  async getServices() {}

  async getCountries() {}

  async getTopCountriesByService(service) {}

  async getPricesV2(params) {}

  async getPricesV3(params) {}

  async getActualWalletAddress(params) {}
}
```

Centralize HTTP request handling:

``` ts
private async request<T>(
  action: string,
  params: Record<string, unknown>
): Promise<T>
```

Automatically add:

``` text
api_key
action
```

------------------------------------------------------------------------

# 34. Purchase Flow

Recommended application flow:

``` text
User selects:

Country
Service
Price

        ↓

POST /api/numbers/purchase

        ↓

Validate user

        ↓

Validate wallet

        ↓

Validate service/country

        ↓

Choose vendor

        ↓

Call SMSBower getNumberV2

        ↓

Receive activationId + phone number

        ↓

Create order

        ↓

Create number activation

        ↓

Reserve/debit wallet

        ↓

Return number to frontend

        ↓

Wait for webhook
```

Important:

Do not permanently debit the user's wallet before the vendor purchase is
known to be successful.

Use a database transaction.

------------------------------------------------------------------------

# 35. Webhook Processing Flow

``` text
POST /api/webhooks/smsbower

        ↓

Check request source

        ↓

Validate JSON payload

        ↓

activationId exists?

        ↓

Find order

        ↓

Correct vendor?

        ↓

Activation belongs to order?

        ↓

Already processed?

        ↓

Save OTP

        ↓

Update activation status

        ↓

Queue realtime notification

        ↓

Return 200
```

------------------------------------------------------------------------

# 36. Realtime Event

Recommended internal event:

``` text
otp.received
```

Payload:

``` json
{
  "orderId": "order_123",
  "activationId": "123456",
  "status": "SMS_RECEIVED",
  "code": "12345",
  "receivedAt": "2026-08-09T18:00:00Z"
}
```

Frontend receives:

``` text
otp.received
```

and updates the order screen.

------------------------------------------------------------------------

# 37. API Endpoints For Your Application

These are NOT SMSBower vendor endpoints. They are recommended endpoints
for your Number Reseller application.

## Vendor-independent user endpoints

``` http
GET /api/vendors
GET /api/vendors/:vendor

GET /api/countries
GET /api/services

GET /api/availability
```

## Number endpoints

``` http
POST /api/numbers/purchase

GET /api/numbers
GET /api/numbers/:id

POST /api/numbers/:id/cancel
POST /api/numbers/:id/retry-sms
POST /api/numbers/:id/complete

GET /api/numbers/:id/status
```

## Order endpoints

``` http
GET /api/orders
GET /api/orders/:id
```

## OTP endpoints

``` http
GET /api/orders/:id/otp
GET /api/orders/:id/otp/history
```

## Wallet endpoints

``` http
GET /api/wallet
GET /api/wallet/transactions
POST /api/wallet/topup-request
```

## Vendor webhook

``` http
POST /api/webhooks/smsbower
```

## Admin vendor endpoints

``` http
GET /api/admin/vendors
GET /api/admin/vendors/:vendor
GET /api/admin/vendors/:vendor/balance
GET /api/admin/vendors/:vendor/availability

POST /api/admin/vendors/:vendor/sync
```

------------------------------------------------------------------------

# 38. Vendor Selection

Do not hard-code:

``` ts
if (country === "x") useSmsBower();
```

Create a routing service.

``` text
VendorRouter
```

Input:

``` json
{
  "country": "2",
  "service": "go",
  "maxPrice": 0.50
}
```

The router checks:

``` text
SMSBower availability
Durian availability
vendor cost
user selling price
provider availability
vendor health
```

Then selects an eligible vendor.

------------------------------------------------------------------------

# 39. Vendor Fallback

Example:

``` text
User requests:
Pakistan + WhatsApp

SMSBower
Stock: 0

Durian
Stock: 15
```

Use:

``` text
Durian
```

If the first vendor returns a confirmed purchase failure, another vendor
may be tried.

Do NOT automatically retry another vendor when the first vendor returns
an ambiguous timeout.

Possible internal states:

``` text
PURCHASE_PENDING
PURCHASE_CONFIRMED
PURCHASE_FAILED
PURCHASE_UNKNOWN
```

`PURCHASE_UNKNOWN` must be reconciled before trying another vendor,
otherwise the application can accidentally purchase two numbers.

------------------------------------------------------------------------

# 40. Price and Profit

Store separately:

``` text
vendor_cost
selling_price
profit
```

Example:

``` text
SMSBower vendor cost = $0.20
User price = $0.35

profit = $0.15
```

Do not calculate historical order profit from the current vendor price.

Save the actual vendor cost at purchase time.

------------------------------------------------------------------------

# 41. Availability Cache

Do not call SMSBower pricing endpoints on every frontend request.

Recommended:

``` text
Cron/worker
     ↓
SMSBower getPrices / getPricesV3
     ↓
Redis
     ↓
Application API
     ↓
Frontend
```

Suggested cache keys:

``` text
vendor:smsbower:prices:{country}:{service}
vendor:smsbower:prices:v3:{country}:{service}
vendor:smsbower:services
vendor:smsbower:countries
```

Use short TTLs for stock/pricing data.

------------------------------------------------------------------------

# 42. Balance Sync

Recommended background job:

``` text
vendor-balance-sync
```

Flow:

``` text
Worker
 ↓
SMSBower getBalance
 ↓
Update vendor_accounts
```

Store:

``` text
last_balance_sync_at
```

and:

``` text
last_error
```

If vendor balance is too low, mark the vendor as temporarily unavailable
for routing.

------------------------------------------------------------------------

# 43. Webhook Reconciliation

Because webhooks can fail or be delayed, periodically reconcile active
SMSBower activations.

Example:

``` text
Every few minutes

Find:
WAITING_FOR_SMS
SMSBOWER activations

        ↓

Call getStatus

        ↓

If STATUS_OK:
  save OTP

If STATUS_CANCEL:
  update order

If STATUS_WAIT_CODE:
  continue waiting
```

This should be a recovery mechanism, not the primary OTP delivery
method.

------------------------------------------------------------------------

# 44. Idempotency

Webhook requests can be retried.

Therefore:

``` text
same activationId
same SMS
```

must not create duplicate OTP records.

Use a unique key or deduplication strategy.

Example:

``` text
vendor
vendor_activation_id
code
received_at
```

or another deterministic event identifier supported by your data model.

------------------------------------------------------------------------

# 45. Security Requirements

Never expose:

``` text
SMSBOWER_API_KEY
```

to frontend clients.

Webhook endpoint must:

-   use HTTPS
-   validate payload
-   validate activation ownership
-   validate vendor
-   prevent duplicate processing
-   limit abuse
-   log failures without secrets

Do not log:

``` text
API key
passwords
session secrets
```

Avoid logging OTP values unless required for development/debugging.

------------------------------------------------------------------------

# 46. Error Normalization

Map vendor responses to internal errors.

Example:

``` text
BAD_KEY
→ VENDOR_AUTH_ERROR
```

``` text
BAD_SERVICE
→ VENDOR_INVALID_SERVICE
```

``` text
BAD_ACTION
→ VENDOR_CONFIGURATION_ERROR
```

``` text
NO_ACTIVATION
→ VENDOR_ACTIVATION_NOT_FOUND
```

``` text
EARLY_CANCEL_DENIED
→ VENDOR_CANCELLATION_NOT_ALLOWED
```

Example internal response:

``` json
{
  "success": false,
  "error": {
    "code": "VENDOR_ACTIVATION_NOT_FOUND",
    "message": "The activation could not be found.",
    "retryable": false
  }
}
```

Do not expose raw vendor errors unnecessarily.

------------------------------------------------------------------------

# 47. Vendor vs Application Status

Keep two statuses.

Example:

``` text
application_status
vendor_status
```

For SMSBower:

``` text
application_status = WAITING_FOR_SMS
vendor_status = STATUS_WAIT_CODE
```

After OTP:

``` text
application_status = SMS_RECEIVED
vendor_status = STATUS_OK
```

After completion:

``` text
application_status = COMPLETED
vendor_status = ACCESS_ACTIVATION
```

This keeps the application independent of vendor-specific state names.

------------------------------------------------------------------------

# 48. Testing Requirements

## Unit tests

Test:

``` text
getBalance parser
getNumber parser
getNumberV2 parser
getStatus parser
setStatus parser
price parser
service parser
country parser
webhook parser
error mapper
```

## Integration tests

Test:

``` text
purchase number
receive webhook
save OTP
request another SMS
complete activation
cancel activation
vendor balance sync
price sync
```

## Failure tests

Test:

``` text
BAD_KEY
BAD_ACTION
BAD_SERVICE
NO_ACTIVATION
EARLY_CANCEL_DENIED
vendor timeout
invalid webhook
duplicate webhook
unknown activation
duplicate purchase
insufficient user wallet
```

------------------------------------------------------------------------

# 49. Example End-to-End Scenario

## User purchases a WhatsApp number

Frontend:

``` http
POST /api/numbers/purchase
```

Body:

``` json
{
  "vendor": "AUTO",
  "service": "wa",
  "country": "2"
}
```

Backend:

``` text
Validate user
 ↓
Check wallet
 ↓
VendorRouter
 ↓
SMSBower selected
 ↓
getNumberV2
```

SMSBower returns:

``` json
{
  "activationId": "123456",
  "phoneNumber": "+123456789",
  "activationCost": 0.20,
  "countryCode": 2,
  "canGetAnotherSms": true,
  "activationTime": "...",
  "activationOperator": "..."
}
```

Backend saves:

``` text
order.status = WAITING_FOR_SMS
number.vendor = SMSBOWER
number.vendor_activation_id = 123456
number.phone_number = +123456789
number.vendor_cost = 0.20
```

Frontend:

``` text
Waiting for SMS...
```

SMSBower sends webhook:

``` json
{
  "activationId": 123456,
  "service": "wa",
  "text": "Your code is 12345",
  "code": "12345",
  "country": 2,
  "receivedAt": "..."
}
```

Backend:

``` text
Find activation
 ↓
Save OTP
 ↓
Update order
 ↓
Publish otp.received
 ↓
HTTP 200
```

Frontend immediately displays:

``` text
OTP: 12345
```

After successful use:

``` text
setStatus(status=6)
```

Vendor returns:

``` text
ACCESS_ACTIVATION
```

Backend:

``` text
order.status = COMPLETED
```

------------------------------------------------------------------------

# 50. Recommended Project Files

Add:

``` text
docs/
├── vendors/
│   └── smsbower/
│       ├── api.md
│       ├── endpoints.md
│       ├── webhook.md
│       ├── lifecycle.md
│       ├── errors.md
│       └── integration.md
│
└── vendor-routing.md
```

If the project prefers fewer files, this document can be used as:

``` text
docs/smsbower-integration.md
```

------------------------------------------------------------------------

# 51. Implementation Checklist

## Vendor client

-   [ ] SMSBower client created
-   [ ] API key stored in environment
-   [ ] Base URL configured
-   [ ] Request helper implemented
-   [ ] Response parser implemented
-   [ ] Error mapper implemented

## Number acquisition

-   [ ] `getNumberV2`
-   [ ] activation ID stored
-   [ ] phone number stored
-   [ ] vendor cost stored
-   [ ] country stored
-   [ ] service stored
-   [ ] operator stored

## OTP

-   [ ] `getStatus`
-   [ ] webhook
-   [ ] webhook validation
-   [ ] webhook idempotency
-   [ ] OTP persistence
-   [ ] realtime frontend update
-   [ ] reconciliation worker

## Activation

-   [ ] status 3
-   [ ] status 6
-   [ ] status 8
-   [ ] early cancellation handling

## Catalog

-   [ ] services sync
-   [ ] countries sync
-   [ ] prices sync
-   [ ] provider prices sync

## Operations

-   [ ] balance sync
-   [ ] vendor health
-   [ ] Redis caching
-   [ ] logs
-   [ ] alerts

## Security

-   [ ] API key never reaches frontend
-   [ ] HTTPS webhook
-   [ ] source validation
-   [ ] activation ownership validation
-   [ ] duplicate webhook protection

## Testing

-   [ ] Unit tests
-   [ ] Integration tests
-   [ ] Webhook tests
-   [ ] Failure tests
-   [ ] Build
-   [ ] Type check
-   [ ] Lint

------------------------------------------------------------------------

# 52. Important Source Limitations

The official client API page documents the operations described above.

It does **not** document every internal business rule, pricing rule,
reseller policy, or account-level restriction.

Do not invent undocumented behavior.

For:

-   `userID`
-   provider selection rules
-   exact vendor billing behavior
-   account-specific limits
-   webhook security beyond the documented source IP
-   undocumented response codes

contact SMSBower support or consult additional official documentation
before implementing assumptions.

------------------------------------------------------------------------

# 53. Final Architecture

The target architecture for the Number Reseller application should be:

``` text
                         FRONTEND
                            │
                            ▼
                      APPLICATION API
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
          Order Service              Wallet Service
              │
              ▼
         Vendor Router
              │
       ┌──────┴──────┐
       │             │
       ▼             ▼
   SMSBower        DurianRCS
       │             │
       │             │
    Webhook       Polling
       │             │
       └──────┬──────┘
              ▼
        OTP Processor
              │
              ▼
          PostgreSQL
              │
              ▼
        Redis / Events
              │
              ▼
        WebSocket/SSE
              │
              ▼
           FRONTEND
```

The important design principle is:

``` text
Vendor-specific behavior stays inside vendor adapters.

Business logic stays vendor-independent.
```

The order system should know:

``` text
purchase number
receive OTP
cancel
complete
```

It should not need to know whether the vendor uses:

``` text
ACCESS_NUMBER
STATUS_OK
STATUS_WAIT_CODE
```

or DurianRCS-specific numeric codes.

That translation belongs inside the vendor adapter.
