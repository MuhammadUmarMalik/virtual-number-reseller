# Changelog

All notable changes to this project.

## Unreleased

### Added
- Product Management: "Add Product" opens a spreadsheet import wizard (CSV/XLSX/XLS) with upload → header detection → column mapping → preview → validation → duplicate prevention → transactional import → summary.
- `ProductNumber` inventory model: numbers sold to users at purchase time for imported products.
- OTP proxy endpoint `GET /api/v1/numbers/:numberId/otp` with authentication, rate limiting, SSRF-safe provider fetching, and OTP saving/deduplication.
- Admin product list: search + status/country/service filters, "View Numbers" for imported inventories, and source-aware actions.
- Active Numbers: "Get OTP" button with inline OTP / "Waiting for OTP..." display.
- Unit tests for phone, SSRF, import parser, OTP parser, and OTP proxy flows.

### Security
- Provider endpoints stored server-side and never returned in API responses.
- SSRF protection on imported provider endpoints (HTTPS-only, no credentials, private/reserved IP block).
- Import file validation (5MB limit, `.csv`/`.xlsx`/`.xls` only, E.164 numbers, country-code matching).

### Changed
- Multi-currency conversion with exchange-rate sync.
- Admin order totals display in the selected currency.
- SMSBower catalog, vendor stock sync, and number/user management for admins.
- Migrations consolidated; users support soft-delete.

### Fixed
- Hardened top-up approvals, FK deletes, and error signalling.

### Known issues
- Imported products store their price in the product's own currency (e.g. USD), but the admin price column still rounds/assumes stored values are PKR when converting for display. Import product prices currently appear at face value discipline of the store's PKR assumption; revisit currency handling for imported products separately.