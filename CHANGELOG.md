# Changelog

## 5.0.0 — 2026-07-28

### Global Editorial Command Center redesign

- Rebuilt the full visual system while preserving the v4.1.0 knowledge data, matcher, Worker contract, ticket macros, and image-analysis behavior.
- Moved global Arabic/English search into the command header and added a responsive navigation drawer.
- Redesigned Home, Ask AI, Create Ticket, Upload Image, Search, article, preview, and admin surfaces with one consistent component language.
- Removed the fixed 1280px desktop minimum and added adaptive desktop, tablet, and mobile layouts.
- Added accessible 2px focus rings, larger touch targets, reduced-motion handling, and improved dark-surface hierarchy.
- Added self-hosted open-source Inter and Amiri webfonts; Arabic content uses Amiri.
- Kept the original black, charcoal, and wine-red SUGO palette.

## 4.1.0 — 2026-07-28

### Complete ticket-title grounding

- Fixed Create Ticket so an official ticket title selects the ticket macro instead of a visible article with the same title.
- Added exhaustive Arabic/English assertions for all 73 official ticket macros.
- Added natural wrapper handling such as `بدي تذكرة عن ...` and `create ticket about ...`.
- Fixed Arabic definite-article matching for short words such as `البث`.
- Added semantic title matching across the entire ticket catalog instead of relying only on a small hard-coded phrase list.
- Replaced generic failure text with focused choices when a short title genuinely matches two procedures.
- Allowed a grounded exact ticket macro to pass the Worker accuracy gate without requiring unrelated case identifiers.
- Updated browser cache keys so GitHub Pages loads the corrected matcher immediately.

## 4.0.0 — 2026-07-28

### Grounded search and results

- Added a high-precision bilingual BM25-style search index with title/path/body weighting, IDF, full-token coverage checks, and deterministic boosts only for decisive routes.
- Made SOP-only mode the default for Ask AI and image analysis.
- Added precise direct/follow-up routes for password reset, country changes, missing recharge, game/app crashes, agencies, and other common Arabic/English requests.
- Ambiguous ban or account-restriction questions now ask for the missing case detail instead of forcing a random policy.

### Ask AI, Create Ticket, and image safety

- Separated reset guidance from a previously submitted reset request, and general recharge troubleshooting from a completed account review.
- Restricted local ticket macros to reliable best/primary candidates.
- Added language, ticket-type, grounding-overlap, grounding-precision, and unsupported-number validation before displaying provider output.
- Image prompts now separate visible evidence, unclear information, the matching SOP, and the safe next action.
- External web search is opt-in only and cannot silently replace internal SOP results.
- Request bodies can no longer disable the Worker's strict accuracy gate.

### Runtime and validation

- Updated supported provider model fallbacks for Gemini, Cerebras, and xAI.
- Added search-precision and grounding-accuracy regression suites.
- Added `.gitignore` protection for Cloudflare state, credentials, dependencies, logs, and generated packages.
- Worker release identifier updated to `4.0.0-grounded-accuracy`.

## 3.1.0 — 2026-07-13

### Ask AI and Create Ticket accuracy

- Separated Ask AI sources from hidden `sv-tickets-*` macros; Ask AI now searches visible SOP articles only.
- Preserved hidden ticket macros for Create Ticket, but only promotes them for exact, direct, or primary route matches.
- Removed the weak ticket-macro force threshold that could place an unrelated template above a stronger SOP match.
- Preserved declared primary-route order so the correct ticket macro is first in Create Ticket and the best visible article is first in Ask AI.
- Added specific routing for sexual pictures/content in messages, general account restrictions, and general login failures.
- Added colloquial Arabic normalization for phrases such as `بدي افتح وكالة`, `ما بقدر أفوت حسابي`, `انحظر حسابي`, and `ما وصلني الشحن`.
- Corrected confidence handling so an ambiguous result cannot simultaneously be reported as High confidence.
- Updated browser cache versions to ensure GitHub Pages loads the corrected matcher immediately.

### Worker prompt alignment

- Ask AI now explicitly instructs the model to use visible SOP articles and reject hidden ticket macros as answer sources.
- Create Ticket still uses the authoritative Ticket field when a macro is a reliable primary match.
- Worker release identifier updated to `3.1.0-mode-aware-accuracy`.

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
