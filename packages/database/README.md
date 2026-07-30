# Database package

This package owns the PostgreSQL schema, Prisma client, migrations, seed data,
money helpers, transaction primitives, and repository foundations.

## Local setup

Set `DATABASE_URL` to a PostgreSQL connection string. From the repository root:

```bash
docker compose up -d postgres
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

The seed is idempotent. It creates an admin, a normal user, zero-balance wallets,
the USA catalog, authorised sample services, mock vendor products, pricing,
purchase controls, and system settings. It deliberately creates no payments,
refunds, orders, or wallet ledger entries. Set `SEED_USER_PASSWORD` and
`SEED_VENDOR_API_KEY_ENCRYPTED` before seeding a shared environment.

## Wallet writes

Use `withLockedWallet` for every balance mutation. Within its callback:

1. Validate the locked balance.
2. Insert one completed `WalletTransaction` with before/after snapshots.
3. Update the wallet balance and increment `version` by exactly one.

The migration enforces this ordering and blocks direct balance changes without a
matching ledger entry. Ledger and audit rows cannot be updated or deleted;
corrections must be appended as reversal records. PostgreSQL also enforces one
completed top-up credit per payment.

Keep remote payment and vendor calls outside a wallet lock. The lock callback
should contain database work only.

## Sensitive data

`Vendor.apiKeyEncrypted`, `Activation.otpEndpointEncrypted`,
`Activation.otpEncrypted`, and `KycSubmission.documentReferenceEncrypted` must
contain application-encrypted ciphertext. `PaymentCallback.redactedPayload`
accepts only the allow-listed, redacted callback representation; raw gateway
payloads have no schema field and must not be persisted.

## Repository usage

Use `createRepositories(prisma)` for the initial user, wallet, owned-order, and
owned-ticket query boundaries. Pass a Prisma transaction client instead when
several repository calls must be atomic.
