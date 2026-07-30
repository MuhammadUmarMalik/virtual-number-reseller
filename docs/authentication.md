# Authentication and Session Security

The browser authentication strategy uses two HTTP-only cookies:

- `nr_access`: a signed HS256 access JWT with a 10-minute default lifetime. It contains only the user ID, role, session ID, issuer, audience, and token type.
- `nr_refresh`: a 48-byte opaque random token with a 30-day default lifetime. Only its SHA-256 hash, token ID, family ID, device metadata, expiry, and revocation state are stored in PostgreSQL.

Both cookies use `SameSite=Strict`, `HttpOnly`, and `Secure` in production. Set `COOKIE_DOMAIN` to the shared parent domain when the web and API use separate subdomains. Set `COOKIE_SECURE=false` only for local HTTP development. Browser requests must use `credentials: "include"` and the API accepts credentialed requests only from `CORS_ORIGINS`.

Refresh tokens rotate on every use. Reuse of a revoked token revokes every active token in that family and writes a security audit log. Password reset revokes all sessions. Users can list and revoke individual sessions or revoke all sessions.

Email, phone, and password reset tokens are single-use opaque values. Only hashes are persisted. The auth service creates and consumes them, while a production mail/SMS delivery adapter must deliver the raw value without logging it. No verification token is returned from a public endpoint.

Required production configuration:

```text
JWT_ACCESS_SECRET=<at least 32 random characters>
JWT_REFRESH_SECRET=<at least 32 different random characters>
ACCESS_TOKEN_TTL_MINUTES=10
REFRESH_TOKEN_TTL_DAYS=30
COOKIE_SECURE=true
COOKIE_DOMAIN=.example.com
CORS_ORIGINS=https://app.example.com
NEXT_PUBLIC_API_URL=https://api.example.com
```

Account onboarding is enforced by `requirePurchaseOnboarding`: a user must have either a verified email or verified phone and `initialTopupDone=true`. That flag must only be set after a verified successful first top-up of at least PKR 500.
