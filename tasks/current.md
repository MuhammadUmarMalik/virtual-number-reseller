# Current Work

## Product Management / Add Product workflow (feature/currency-conversion branch)

Replaces the "Browse SMSBower" primary flow with a Product Management /
spreadsheet import workflow. Backend and frontend implementation complete;
validation and QA pending.

| Item | Status |
| --- | --- |
| Data model: ProductNumber + ProductSource/ProductNumberStatus + migration | Done |
| Import service: parse → validate → dedupe → preview → transactional import | Done |
| CSV/XLSX/XLS upload endpoints (multer, 5MB, extension filter) | Done |
| SSRF-safe provider endpoint validation + OTP proxy endpoint `GET /numbers/:id/otp` | Done |
| Imported inventory purchase branch in order service | Done |
| Admin product list filters (search/status/country/service) + View Numbers | Done |
| Frontend import wizard + product numbers modal + Get OTP inline display | Done |
| Unit tests (phone, ssrf, import parser, otp parser, otp proxy) | Done |
| Install `xlsx`; run prisma validate, type-check, lint, tests, build | In progress |
| CHANGELOG + known-issue notes | Done |