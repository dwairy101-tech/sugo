# Changelog

## 3.0.0 — 2026-07-12

### Create Ticket accuracy

- Added exact Arabic/English title and alias matching before broad keyword routing.
- Exact support-macro titles now return the matching local ticket directly instead of allowing an unrelated AI guess.
- Short or ambiguous SOP-only requests now ask for the missing case details instead of returning an unrelated policy response.
- Removed the unconditional hidden-ticket score bonus that could select an arbitrary macro.
- Search indexing now uses substantive Answer content and excludes generic greeting/closing boilerplate.

### Arabic/English text consistency

- Audited visible support macros and hidden ticket macros in both languages.
- Removed repeated greetings, help questions, apologies, thank-you lines, and support-team signatures.
- Corrected mixed Arabic/English ticket bodies in recharge-agent macros.
- Preserved substantive policy lines, repeated agent names attached to different IDs, and intentional checklist labels.
- Removed internal staff mentions from customer-facing reporting tickets.
- Corrected several inaccurate or malformed ticket bodies, including sub-agency conversion, issue reporting, and live-smoking ban text.

### Worker and validation

- The Worker now respects ticket type, apology style, and requested language in its prompt and final cleanup.
- Added semantic duplicate protection in both the frontend and Worker.
- Added regression tests for exact-title routing, local deterministic tickets, safe clarification fallback, data-wide duplicate checks, internal-leak prevention, and policy-line preservation.
- Added the missing GitHub Actions validation workflow.

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

## 2026-07-12 — Visual guide relevance fix

- Related screenshots now use only decisive topic matches (`primary` / `selected`) from the knowledge-base matcher.
- Low-confidence and lower-ranked secondary topic suggestions can no longer inject unrelated images.
- Ambiguous queries display no visual guide instead of showing a misleading screenshot.
- Direct SOP article image mappings remain available.
- Added regression tests for greeting, country change, account restriction, password reset, and ambiguous support queries.
