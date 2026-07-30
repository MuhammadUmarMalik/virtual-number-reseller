# API Documentation

All API responses use one envelope.

```json
{
  "success": true,
  "data": {},
  "requestId": "req_..."
}
```

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request payload is invalid.",
    "details": null,
    "requestId": "req_..."
  }
}
```

## Foundation Endpoints

### GET /api/health

Returns service health.

### GET /api/health/database

Runs a lightweight PostgreSQL connectivity check.

### GET /api/health/redis

Runs a lightweight Redis connectivity check.

## Authentication Endpoints

Authentication uses HTTP-only access and refresh cookies. Browser requests must send credentials.
See `docs/authentication.md` for the complete session strategy.

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/verify/email/request
POST   /api/auth/verify/email
POST   /api/auth/verify/phone/request
POST   /api/auth/verify/phone
GET    /api/auth/sessions
DELETE /api/auth/sessions/:sessionId
DELETE /api/auth/sessions
```

Registration creates the user and PKR wallet in one database transaction. Login failures always return
`INVALID_CREDENTIALS` with the same public message. Password-reset requests return the same success
message whether the account exists or not.

The `me`, login, registration, and refresh responses include:

```json
{
  "onboarding": {
    "accountVerified": false,
    "initialTopupDone": false,
    "canPurchase": false,
    "minimumFirstTopup": 500,
    "wallet": { "balance": "0.00", "currency": "PKR" }
  }
}
```

`POST /api/orders` is protected by authentication, active-account, and onboarding middleware. It returns
`VERIFICATION_REQUIRED` or `INITIAL_TOPUP_REQUIRED` before purchase logic is reached.
