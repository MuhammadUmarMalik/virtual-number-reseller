# Vendor API — Durian RCS

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
