# Tests & Fixtures

Shared workspace for test plans and test data fixtures used by the QA engineer.

- `plans/` — per-feature test plans and acceptance scenarios.
- `fixtures/` — reusable test data fixtures (e.g. seed JSON for wallet/order/top-up/refund cases).

Backend tests run with Vitest (`cd backend && npm test`); frontend validation is `npm run lint`, `npm run type-check`, `npm run build`.