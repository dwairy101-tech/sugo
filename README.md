# SUGO SOP

A clean, static, GitHub-ready rebuild of the SUGO support knowledge base, AI assistant, image-analysis workspace, and AI ticket-drafting console.

## Final scope

- **Desktop only:** minimum supported viewport width is 1280 px.
- **English application interface:** product chrome, controls, buttons, and primary headings are English and LTR.
- **Bilingual knowledge content:** original English and Arabic article content is retained, searchable, copyable, and displayed with the correct per-block direction.
- **Reference screenshots are visual references only:** their business titles and sample categories are not imported unless verified in the legacy source.
- **Unchanged Worker:** `worker/worker.js` is copied byte-for-byte from the supplied production Worker.
- **No build step:** the frontend uses plain HTML, CSS, and ordered JavaScript files.

## Repository structure

```text
sugo-sop/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── kb-data.js
│   │   ├── kb-content.js
│   │   ├── kb-matcher.js
│   │   ├── worker-api.js
│   │   ├── admin.js
│   │   └── app.js
│   └── data/
│       ├── content-audit.json
│       └── legacy-deleted-panes.json
├── worker/
│   ├── worker.js
│   └── wrangler.toml
├── README.md
└── .gitignore
```

## Knowledge-base inventory

| Item | Final count |
|---|---:|
| Knowledge-base roots | 2 |
| Categories | 16 |
| Sections | 72 |
| Visible topics | 284 |
| Active runtime panes | 285 |
| Hidden active AI-routing panes | 1 |
| Historical pane IDs removed by the legacy cleanup layer and retained only for audit | 119 |
| Bilingual dual-text panes | 189 |
| Bilingual support-macro panes | 96 |

The active content corpus has complete visible-navigation coverage. `public/data/content-audit.json` records the source hashes, counts, bilingual parity checks, and the approved Phase 19 completion pass. That pass corrected 27 pane entries where one language, a customer-facing Ticket field, or a greeting/closing envelope was incomplete.

## Feature map

| Legacy or approved feature | New implementation |
|---|---|
| Product shell, top bar, breadcrumb, sidebar, workspace, and output column | `public/js/app.js`, `public/css/styles.css` |
| Collapsed-by-default upper `Menu` tree | `public/js/app.js` |
| Two original KB roots and full nested navigation | `public/js/kb-data.js`, `public/js/app.js` |
| Active English/Arabic pane corpus | `public/js/kb-content.js` |
| Favorites and recent topics | `public/js/app.js`, browser local storage |
| Bilingual article detail, filters, copy actions, related topics | `public/js/app.js` |
| English and Arabic full-content search | `public/js/app.js` |
| Client-side KB ranking and request audit metadata | `public/js/kb-matcher.js` |
| Create Ticket selector, context fields, image evidence, live draft, AI generation | `public/js/app.js`, `public/js/worker-api.js` |
| Ask AI modes, SOP mode, focus profiles, follow-up, copy, retry, stop | `public/js/app.js`, `public/js/worker-api.js` |
| Upload Image analysis and Vision Ticket handoff | `public/js/app.js`, `public/js/worker-api.js` |
| AI answer-to-ticket output population | `SUGO.TicketBuilder.applyGeneratedTicket(...)` in `public/js/app.js` |
| JSON and defensive SSE response parsing | `public/js/worker-api.js` |
| KV-backed pane editing, reset, and menu editing | `public/js/admin.js` |
| Unchanged Cloudflare Worker and provider fallback logic | `worker/worker.js` |

## Screenshot-to-feature map

The supplied composite screenshot was used for geometry, spacing, typography, borders, and component styling only.

| Reference position | Rebuilt feature |
|---|---|
| Welcome shell | Default application shell and empty workspace state |
| Category and section views | Nested original KB navigation |
| Article screen | Bilingual article detail and related topics |
| AI Answer screen | Ask AI result and follow-up panel |
| Create Ticket screen | AI drafting form and output preview; no unsupported external ticket database was invented |
| Internal Notes screen | Existing authenticated pane editor and original internal-note content |
| Favorites screen | Favorites tab in the sidebar |
| Recent Topics screen | Recent tab in the sidebar |
| All Topics screen | Original navigation tree and search results |
| Search Results screen | Ranked bilingual search experience |

## Local frontend preview

No package installation is required.

```bash
cd public
python -m http.server 8080
```

Open `http://localhost:8080` in a desktop browser. Keep the viewport at 1280 px or wider.

The frontend currently targets the original production Worker URL in:

```text
public/js/worker-api.js
public/js/admin.js
```

The AI URL intentionally matches the legacy contract. When deploying the Worker under a different URL, update the `DEFAULT_BASE_URL` constant in `worker-api.js`. The admin/content layer also supports defining `window.SUGO_WORKER_URL` before `admin.js` loads.

## Frontend ↔ Worker contract

AI calls use `POST` directly to the Worker base URL, with `Content-Type: application/json` and no `/chat` path.

### Request body

The frontend sends:

```text
task_type
workspace
max_completion_tokens
response_mode
output_type
language
sop_mode
kb_matches
kb_confidence
kb_confidence_score
kb_ambiguous
kb_primary_route
kb_query_intents
has_image
images
image
cache
stream
messages
```

Key routing values:

| Workspace | `task_type` | `workspace` | `output_type` |
|---|---|---|---|
| Ask AI | `ask_ai` | `ask_ai` | `answer` |
| Create Ticket | `create_ticket` | `create_ticket` | `ticket` |
| Create Ticket with image | `image_analysis` | `upload_image` | `ticket` |
| Upload Image answer | `image_analysis` | `upload_image` | `answer` |
| Upload Image ticket | `image_analysis` | `upload_image` | `ticket` |

Token limits are preserved:

| Output | Brief | Detailed / Step |
|---|---:|---:|
| Answer | 5200 | 9000 |
| Ticket | 4200 | 7000 |

The active frontend sends `stream: false`; therefore the normal production response is OpenAI-style JSON from `choices[0].message.content`. The defensive `text/event-stream` parser remains implemented and supports `json.response`, OpenAI-style deltas, and `[DONE]`.

Image requests send one compressed image in both `images[0]` and `image`, with matching `{ mimeType, data, name, width, height }` objects. Image requests use `cache: false`; text-only requests use `cache: true`.

### Admin/content routes

| Method | Route | Frontend use |
|---|---|---|
| GET | `/menu` | Load integrated menu overrides |
| GET | `/content` | Load pane overrides |
| POST | `/admin/menu` | Save menu changes |
| POST | `/admin/pane` | Save one pane override |
| POST | `/admin/pane/reset` | Reset one pane override |
| POST | `/admin/content` | Supported by the unchanged Worker; not called by the rebuilt frontend |
| GET | `/health` | Worker health report |
| GET | `/diagnostics` | Extended Worker diagnostics |
| OPTIONS | any route | CORS preflight |

Admin POST calls use `Authorization: Bearer <ADMIN_PASSWORD>`.

## Deploy the Cloudflare Worker

Cloudflare recommends running Wrangler locally through `npx`.

```bash
cd worker
npx wrangler login
npx wrangler kv namespace create SUGO_KV
```

Copy the generated namespace ID into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SUGO_KV"
id = "YOUR_NAMESPACE_ID"
```

Add the admin password and at least one provider key:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put GEMINI_API_KEY
# or:
npx wrangler secret put CEREBRAS_API_KEY
# or:
npx wrangler secret put GROK_API_KEY
```

Then deploy:

```bash
npx wrangler deploy
```

The Worker also accepts key rotation:

- Gemini: `GEMINI_KEY`, `GEMINI_API_KEY`, `GEMINI_KEY_1…50`, `GEMINI_API_KEY_1…50`
- Cerebras: `CEREBRAS_KEY`, `CEREBRAS_API_KEY`, `CEREBRAS_KEY_1…50`, `CEREBRAS_API_KEY_1…50`
- Grok/xAI: `GROK_API_KEY`, `XAI_API_KEY`, `GROK_KEY`, `XAI_KEY`, and numbered variants

Optional Worker variables:

```text
GEMINI_MODEL
CEREBRAS_MODEL
GROK_MODEL
CORS_ORIGIN
CACHE_TTL_SECONDS
DEBUG_ERRORS
LOG_REQUESTS
STRICT_ACCURACY_GATE
MAX_MESSAGES
MAX_INPUT_CHARS
MAX_IMAGES_PER_REQUEST
MAX_IMAGE_BASE64_CHARS
PROVIDER_TIMEOUT_MS
RATE_LIMIT_PER_MINUTE
RATE_LIMIT_WINDOW_SECONDS
```

Never commit real passwords, API keys, `.env`, or `.dev.vars` files.

## Static frontend deployment

`public/` can be deployed to any static host. For Cloudflare Pages with Wrangler:

```bash
npx wrangler pages deploy public --project-name sugo-sop
```

After deployment, confirm that the frontend Worker URL points to the deployed Worker and set `CORS_ORIGIN` appropriately when a restricted origin is desired.

## Final QA summary

The final pass verifies:

- JavaScript syntax for every frontend module and the unchanged Worker.
- Local asset references and ordered script loading.
- No uncaught page exceptions in the tested flows.
- No unexpected failed requests in mocked integration tests.
- Menu closed on initial load and opens on click.
- No document-level horizontal overflow at 1536×960 or 1280×800.
- English LTR application chrome.
- English LTR and Arabic RTL article blocks.
- English and Arabic search.
- All 284 visible topics resolve to active content.
- Create Ticket text and image request contracts.
- Ask AI, one-turn follow-up, JSON parsing, and SSE parsing.
- Upload Image answer/ticket modes and smart ticket handoff.
- Timeout, stop, retry, and HTTP-error states.
- KV pane save/reset and menu save contracts with Bearer authorization.
- Direct execution of the unchanged Worker against the exact generated Ask AI, Create Ticket, and image request bodies.
- Worker health, diagnostics, CORS, content, menu, admin, validation, JSON, and SSE branches.

Live calls to Gemini, Cerebras, or Grok require the deployer's private provider keys. The final automated integration suite used deterministic mock provider responses while executing the real unchanged Worker request-validation and routing code.

## Known boundaries

- The Worker has no external ticket-system submission endpoint. `Create Ticket` produces a ready-to-copy draft and does not claim that a third-party ticket was submitted.
- The notification badge is visual only because the legacy frontend and Worker do not expose a notification API.
- The application is intentionally desktop-only.
- The interface is English-only; bilingual article content remains intact by design.

## GitHub push

The repository is ready for normal Git initialization:

```bash
git init
git add .
git commit -m "Rebuild SUGO SOP frontend"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```
