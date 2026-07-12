# Changelog

## 2.9.1 — 2026-07-12

### Cloudflare deployment safety

- Fixed production-version detection so the active deployed version is used instead of the oldest historical version.
- Reuses the exact `SUGO_KV` namespace attached to production and stops safely if it cannot be identified.
- Records the previous production version locally before deployment.
- Verifies `/diagnostics` returns HTTP 401 after deployment.
- Runs a real post-deployment AI connectivity check.
- Corrected the read-only diagnostic report to inspect the active production version.

## 2.9.0 — 2026-07-12

### Search and ticket accuracy

- Fixed Arabic definite-article handling in precision routes.
- Corrected country-change routing for phrases such as “تغيير البلد”.
- Corrected password-reset routing for phrases such as “نسيت كلمة المرور”.
- Added a general account restriction/ban route for phrases such as “حسابي مقيد” and “الحساب محظور”.
- Added regression tests for the most important Arabic and English support routes.

### Worker security

- Added separate administrator endpoint rate limiting.
- Protected `/diagnostics` with the administrator bearer password.
- Added constant-time administrator password comparison.
- Hid provider failure details by default unless `DEBUG_ERRORS=true`.
- Strengthened editable HTML sanitization.
- Added CORS allow-list support and baseline security headers.
- Added `Cache-Control: no-store` to JSON responses.

### GitHub readiness

- Added root `package.json` and a complete automated validation suite.
- Added GitHub Actions validation.
- Added a safe GitHub Pages 404 redirect.
- Added Arabic upload instructions and reorganized historical documentation.
- Updated the Cloudflare setup packager to include the complete repository source.
