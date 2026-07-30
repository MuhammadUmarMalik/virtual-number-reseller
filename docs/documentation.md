## Getting Started

All API communication is executed over secure HTTPS protocols. Request headers require `Accept: application/json` and `Content-Type: application/json` schemas.

Production Base API Endpoint:

https://api.smsotps.com/api/

## Authentication

Include your personal secure developer key within the request headers. Generate, rotate, or revoke keys at any time via your [Profile Portal](https://smsotps.com/profile).

#### Required Custom HTTP Header:

**X-API-KEY:** **YOUR\_API\_KEY\_HERE**

#### Your Developer API Key

YOUR_API_KEY_HERE

Rotate API KeyRevoke API Key

## Balance & Ledger

### Get Balance Details

**GET**API URLPythonNode.js

https://api.smsotps.com/api/balance

```
fetch("https://api.smsotps.com/api/balance", {
  headers: {
    "Accept": "application/json",
    "X-API-KEY": "YOUR_API_KEY_HERE"
  }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "balance": "15.42",
  "currency": "USD"
}
```

## Get Countries List (Provider A)

### Query Supported Carrier Countries

**GET**API URLPythonNode.js

/provider\_a\_countries.json

```
fetch("https://smsotps.com/provider_a_countries.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "16": {
    "name": "United Kingdom",
    "operators": ["any", "o2", "ee", "lebara", "three", "vodafone"]
  },
  "187": {
    "name": "USA",
    "operators": ["any", "tmobile", "at_t", "verizon"]
  }
}
```

## Get Services List (Provider A)

### Query Service Lookup Mapping

**GET**API URLPythonNode.js

/provider\_a\_services.json

```
fetch("https://smsotps.com/provider_a_services.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "fb": "facebook",
  "ig": "Instagram+Threads",
  "wa": "Whatsapp",
  "tg": "Telegram",
  "go": "Google,youtube,Gmail"
}
```

## Get SMS Offers (Provider A)

### Query Active SMS Prices

**GET**API URLPythonNode.js

https://api.smsotps.com/api/p\_a/offers/{service}/{country}

```
fetch("https://api.smsotps.com/api/p_a/offers/fb/1")
  .then(res => res.json())
  .then(console.log);
```

##### Response Parameters:

* `price`: Float. The actual purchase cost per number lease.
* `available`: Integer. The current count of active available numbers (pieces/pcs) ready for instant leasing.
* `operator`: String. The carrier network provider (e.g. `"any"` or carrier key).

##### Response Example (200 Success):

```
{
  "status": "success",
  "offers": [
    {
      "operator": "any",
      "price": 0.08,
      "available": 3540
    }
  ]
}
```

## Order SMS Number (Provider A)

### Lease Number (Provider A)

POST

https://api.smsotps.com/api/order-number

POST Parameters (JSON Body):

* `provider`: String, **required**. Exactly `"provider_a"`
* `service`: String, **required**. The service shortcode (e.g. `"fb"`)
* `country`: Integer, **required**. The country ID (e.g. `1`)
* `operator`: String, optional. Carrier operator code. Omit (or set to `"any"`) to let the system pick any available carrier.
* `max_price`: Float, optional. Maximum price budget per number. Omit to accept any price.

##### Example — Required params only (any operator, any price):

```
POST https://api.smsotps.com/api/order-number
X-API-KEY: YOUR_API_KEY_HERE
Content-Type: application/json

{
  "provider": "provider_a",
  "service": "fb",
  "country": 1
}
```

##### Example — With operator & max price (optional):

```
POST https://api.smsotps.com/api/order-number
X-API-KEY: YOUR_API_KEY_HERE
Content-Type: application/json

{
  "provider": "provider_a",
  "service": "fb",
  "country": 1,
  "operator": "o2",
  "max_price": 0.15
}
```

##### Response Example (200 Success):

```
{
  "id": 98514,
  "number": "+17799042123",
  "status": "active",
  "price": 0.08,
  "operator": "any",
  "created_at": "2026-05-17T22:31:00Z"
}
```

## Check Lease Status (Provider A)

### Query Lease Order

**GET**API URLPythonNode.js

https://api.smsotps.com/api/number-status/{id}

```
fetch("https://api.smsotps.com/api/number-status/98514", {
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success - Code Received):

```
{
  "id": 98514,
  "number": "+17799042123",
  "status": "completed",
  "sms_code": "845120",
  "full_text": "Your Facebook confirmation code is 845120"
}
```

## Cancel Lease Order (Provider A)

### Cancel Order

**POST**API URLPythonNode.js

https://api.smsotps.com/api/cancel-number/{id}

```
fetch("https://api.smsotps.com/api/cancel-number/98514", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Resend SMS OTP (Provider A)

### Resend Request

**POST**API URLPythonNode.js

https://api.smsotps.com/api/resend-sms/{id}

```
fetch("https://api.smsotps.com/api/resend-sms/98514", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Get Countries List (Provider B)

### Query Supported Carrier Countries

**GET**API URLPythonNode.js

/provider\_b\_countries.json

```
fetch("https://smsotps.com/provider_b_countries.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "16": {
    "name": "United Kingdom",
    "operators": ["any", "o2", "ee", "lebara", "three", "vodafone"]
  },
  "187": {
    "name": "USA",
    "operators": ["any", "tmobile", "at_t", "verizon"]
  }
}
```

## Get Services List (Provider B)

### Query Service Lookup Mapping

**GET**API URLPythonNode.js

/provider\_b\_services.json

```
fetch("https://smsotps.com/provider_b_services.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "fb": "facebook",
  "ig": "Instagram+Threads",
  "wa": "Whatsapp",
  "tg": "Telegram",
  "go": "Google,youtube,Gmail"
}
```

## Get SMS Offers (Provider B)

### Query Active SMS Prices

**GET**API URLPythonNode.js

https://api.smsotps.com/api/p\_b/offers/{service}/{country}

```
fetch("https://api.smsotps.com/api/p_b/offers/fb/1")
  .then(res => res.json())
  .then(console.log);
```

##### Response Parameters:

* `price`: Float. The actual purchase cost per number lease.
* `available`: Integer. The current count of active available numbers (pieces/pcs) ready for instant leasing.
* `operator`: String. The carrier network provider (e.g. `"any"` or carrier key).

##### Response Example (200 Success):

```
{
  "status": "success",
  "offers": [
    {
      "operator": "any",
      "price": 0.09,
      "available": 1420
    }
  ]
}
```

## Order SMS Number (Provider B)

### Lease Number (Provider B)

POST

https://api.smsotps.com/api/order-number

POST Parameters (JSON Body):

* `provider`: String, **required**. Exactly `"provider_b"`
* `service`: String, **required**. The service shortcode (e.g. `"fb"`)
* `country`: Integer, **required**. The country ID (e.g. `1`)
* `operator`: String, optional. Carrier operator code. Omit (or set to `"any"`) to let the system pick any available carrier.
* `max_price`: Float, optional. Maximum price budget per number. Omit to accept any price.

##### Example — Required params only (any operator, any price):

```
POST https://api.smsotps.com/api/order-number
X-API-KEY: YOUR_API_KEY_HERE
Content-Type: application/json

{
  "provider": "provider_b",
  "service": "fb",
  "country": 1
}
```

##### Example — With operator & max price (optional):

```
POST https://api.smsotps.com/api/order-number
X-API-KEY: YOUR_API_KEY_HERE
Content-Type: application/json

{
  "provider": "provider_b",
  "service": "fb",
  "country": 1,
  "operator": "tmobile",
  "max_price": 0.15
}
```

##### Response Example (200 Success):

```
{
  "id": 98515,
  "number": "+17799042125",
  "status": "active",
  "price": 0.09,
  "operator": "any",
  "created_at": "2026-05-17T22:35:00Z"
}
```

## Check Lease Status (Provider B)

### Query Lease Order

**GET**API URLPythonNode.js

https://api.smsotps.com/api/number-status/{id}

```
fetch("https://api.smsotps.com/api/number-status/98515", {
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success - Code Received):

```
{
  "id": 98515,
  "number": "+17799042125",
  "status": "completed",
  "sms_code": "410294",
  "full_text": "Your Facebook verification code is 410294"
}
```

## Cancel Lease Order (Provider B)

### Cancel Order

**POST**API URLPythonNode.js

https://api.smsotps.com/api/cancel-number/{id}

```
fetch("https://api.smsotps.com/api/cancel-number/98515", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Resend SMS OTP (Provider B)

### Resend Request

**POST**API URLPythonNode.js

https://api.smsotps.com/api/resend-sms/{id}

```
fetch("https://api.smsotps.com/api/resend-sms/98515", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Get Countries List (Provider D)

### Query Supported Carrier Countries

**GET**API URLPythonNode.js

/provider\_d\_countries.json

```
fetch("https://smsotps.com/provider_d_countries.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "74": {
    "name": "Afghanistan",
    "operators": ["any"]
  },
  "155": {
    "name": "Albania",
    "operators": ["any"]
  }
}
```

## Get Services List (Provider D)

### Query Supported Services

**GET**API URLPythonNode.js

/provider\_d\_services.json

```
fetch("https://smsotps.com/provider_d_services.json", {
  headers: { "Accept": "application/json" }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "tg": "Telegram",
  "wa": "Whatsapp"
}
```

## Get Offers (Provider D)

### Query Offers & Pricing

**GET**API URLPythonNode.js

/p\_d/offers/{service}/{country\_id}

```
fetch("https://api.smsotps.com/api/p_d/offers/tg/74", {
  headers: {
    "Accept": "application/json",
    "X-API-KEY": "YOUR_API_KEY_HERE"
  }
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
[
  {
    "name": "any",
    "localName": "Any Operator",
    "offers": [
      {
        "price": "0.1500",
        "count": 125
      }
    ]
  }
]
```

## Order Number (Provider D)

### Order Activation Number

**POST**API URLPythonNode.js

https://api.smsotps.com/api/order-number

POST Parameters (JSON Body):

* `provider`: String, exactly `"provider_d"`
* `service`: Service code (e.g. `"tg"`)
* `country`: Country ID code (integer, e.g. `74`)
* `maxPrice`: (Optional) Float limit price tier. If set, restricts purchases below this amount.

```
fetch("https://api.smsotps.com/api/order-number", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": "YOUR_API_KEY_HERE"
  },
  body: JSON.stringify({
    "provider": "provider_d",
    "service": "tg",
    "country": 74
  })
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "id": 89410,
  "phone": "+93740123456",
  "price": 0.1500,
  "balance_remaining": 15.27
}
```

## Check Status & SMS Code (Provider D)

### Get Activation Status

**GET**API URLPythonNode.js

https://api.smsotps.com/api/number-status/{id}

```
fetch("https://api.smsotps.com/api/number-status/89410", {
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success):

```
{
  "status": "STATUS_OK:675124"
}
```

## Cancel Lease Order (Provider D)

### Cancel Order

**POST**API URLPythonNode.js

/cancel-number/{id}

```
fetch("https://api.smsotps.com/api/cancel-number/89410", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Resend SMS OTP (Provider D)

### Resend Request

**POST**API URLPythonNode.js

https://api.smsotps.com/api/resend-sms/{id}

```
fetch("https://api.smsotps.com/api/resend-sms/89410", {
  method: "POST",
  headers: {"Accept": "application/json", "X-API-KEY": "YOUR_API_KEY_HERE"}
})
.then(res => res.json())
.then(console.log);
```

## Get Services & Options (Provider C)

### Get Supported Options

**GET**API URLPythonNode.js

Get a detailed nested directory listing all services and countries available under the Link Provider C portal.

https://api.smsotps.com/api/p\_c/options

```
fetch("https://api.smsotps.com/api/p_c/options")
  .then(res => res.json())
  .then(console.log);
```

## Get Link Offers

### Query Active Link Offers

**GET**API URLPythonNode.js

https://api.smsotps.com/api/p\_c/offers/{service}/{country}

```
fetch("https://api.smsotps.com/api/p_c/offers/fb/1")
  .then(res => res.json())
  .then(console.log);
```

##### Response Example (200 Success):

```
{
  "status": "success",
  "offers": [
    {
      "price": 0.12,
      "available": 84
    }
  ]
}
```

## Bulk Link Orders (Provider C)

### Order Bulk Links

**POST**API URLPythonNode.js

Order verification link numbers in quantity bulk. Returns the matching leased lines instantly.

https://api.smsotps.com/api/order-number

POST Parameters (JSON Body):

* `provider`: String, exactly `"provider_c"`
* `service`: Service tag (e.g. `"fb"`)
* `country`: Country ID (integer code, e.g. `1`)
* `quantity`: Integer, quantity bulk limit (e.g. `2`)

```
fetch("https://api.smsotps.com/api/order-number", {
  method: "POST",
  headers: {
    "Accept": "application/json",
    "Content-Type": "application/json",
    "X-API-KEY": "YOUR_API_KEY_HERE"
  },
  body: JSON.stringify({
    "provider": "provider_c",
    "service": "fb",
    "country": 1,
    "quantity": 2
  })
})
.then(res => res.json())
.then(console.log);
```

##### Response Example (200 Success - Bulk link object):

```
{
  "status": "success",
  "order_id": 561075,
  "numbers": [
    "+18159801235|https://sms222.us/fb-link-auth?key=qWnKz1x9c",
    "+18159801236|https://sms222.us/fb-link-auth?key=qWnKz1x9d"
  ],
  "total_price": 0.24,
  "quantity": 2
}
```
