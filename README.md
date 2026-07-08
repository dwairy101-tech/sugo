# SUGO SOP Portal Rebuild

A dependency-free, static front-end rebuild of the SUGO SOP support console, plus the existing Cloudflare Worker backend contract. The app preserves the migrated bilingual SOP knowledge base, visible navigation topics, orphan panes, dynamic macros, AI support workflows, ticket drafting, upload/vision analysis, quick access, and admin editable-content hooks.

The front end is plain HTML/CSS/JavaScript. There is no framework, no bundler, and no npm dependency required for the browser app.

## Repository structure

```text
sugo-sop/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── content.js
│       └── app.js
├── worker/
│   ├── worker.js
│   └── wrangler.toml
├── docs/
│   ├── CONTENT_MANIFEST.md
│   ├── REGRESSION_CHECKLIST.md
│   ├── INTENTIONAL_DIFFERENCES.md
│   ├── PHASE_21_CONSISTENCY_AUDIT.md
│   ├── phase21_audit_results_fast.json
│   └── stage20_validation.json
├── README.md
└── .gitignore
```

## What is included

- Unified dark/red design system derived from the approved Create Ticket reference.
- Responsive app shell with sidebar, mobile drawer, topbar, route panels, and quick-access drawer.
- Full migrated SOP data model:
  - 284 visible navigation topics.
  - 414 total tracked pane records.
  - 120 orphan panes preserved and marked as not in navigation.
  - 37 dynamic macros preserved.
  - 414 / 414 tracked pane records migrated.
  - 0 pending and 0 flagged records.
- One consolidated search/ranking implementation for visible topics, orphan panes, and dynamic macros.
- Ask AI workspace with streaming Worker integration.
- Create Ticket workspace with local draft/template logic.
- Upload Image workspace with drag/drop, preview, validation, structured prompt builder, and image-analysis Worker integration.
- Admin Hooks workspace wired to the existing Worker admin endpoints.
- Accessibility pass: skip link, focus-visible states, drawer focus handling, Escape close behavior, reduced-motion support.

## Local preview

For a static browser preview of the front end:

```bash
cd sugo-sop/public
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

The UI will load locally, but live AI calls require the Worker endpoints to be available at the same origin, because the app intentionally calls the existing contract with relative paths such as `POST /`, `GET /menu`, and `POST /admin/pane`.

## Cloudflare Worker deployment

Install Wrangler if needed:

```bash
npm install -g wrangler
wrangler login
```

Create a KV namespace for SUGO data:

```bash
wrangler kv namespace create SUGO_KV
wrangler kv namespace create SUGO_KV --preview
```

Copy the generated namespace IDs into `worker/wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SUGO_KV"
id = "REPLACE_WITH_YOUR_SUGO_KV_NAMESPACE_ID"
preview_id = "REPLACE_WITH_YOUR_PREVIEW_SUGO_KV_NAMESPACE_ID"
```

Set required secrets. At minimum, set `ADMIN_PASSWORD` and at least one provider API key:

```bash
cd sugo-sop/worker
wrangler secret put ADMIN_PASSWORD
wrangler secret put GEMINI_API_KEY
# or:
wrangler secret put CEREBRAS_API_KEY
# or:
wrangler secret put GROK_API_KEY
# or:
wrangler secret put XAI_API_KEY
```

Deploy the Worker:

```bash
wrangler deploy
```

Host the `public/` folder using your preferred static hosting method. For same-origin behavior, deploy the static UI and Worker behind the same route/domain or proxy frontend AI/admin requests to the Worker.

## Required and optional environment variables / secrets

| Name | Type | Required | Purpose |
|---|---:|---:|---|
| `ADMIN_PASSWORD` | Secret | Yes for admin writes | Bearer token used by `/admin/menu`, `/admin/content`, `/admin/pane`, and `/admin/pane/reset`. |
| `GEMINI_API_KEY`, `GEMINI_KEY`, `GEMINI_KEY_1...50`, `GEMINI_API_KEY_1...50` | Secret | At least one provider key recommended | Gemini provider keys with rotation/fallback support. |
| `CEREBRAS_API_KEY`, `CEREBRAS_KEY`, `CEREBRAS_KEY_1...50`, `CEREBRAS_API_KEY_1...50` | Secret | Optional | Cerebras provider keys with rotation/fallback support. |
| `GROK_API_KEY`, `XAI_API_KEY`, `GROK_KEY`, `XAI_KEY`, numbered variants | Secret | Optional | xAI/Grok provider keys with rotation/fallback support. |
| `SUGO_KV` | KV binding | Yes for persisted content/menu/admin hooks | Cloudflare KV binding used by editable content, menu, and pane overrides. |
| `CORS_ORIGIN` | Var | Optional | Allowed CORS origin; defaults to `*`. |
| `GEMINI_MODEL` | Var | Optional | Gemini model override. |
| `CEREBRAS_MODEL` | Var | Optional | Cerebras model override. |
| `GROK_MODEL` | Var | Optional | Grok/xAI model override. |
| `STRICT_ACCURACY_GATE` | Var | Optional | Enables/disables stricter response gate behavior. |
| `DEBUG_ERRORS` | Var | Optional | Controls debug error exposure. |
| `LOG_REQUESTS` | Var | Optional | Controls Worker request logging. |
| `MAX_MESSAGES` | Var | Optional | Maximum chat messages accepted by Worker. |
| `MAX_INPUT_CHARS` | Var | Optional | Maximum text input length. |
| `MAX_IMAGES_PER_REQUEST` | Var | Optional | Maximum images accepted per image-analysis request. |
| `MAX_IMAGE_BASE64_CHARS` | Var | Optional | Maximum base64 image payload length. |
| `RATE_LIMIT_PER_MINUTE` | Var | Optional | Per-client request limit. |
| `RATE_LIMIT_WINDOW_SECONDS` | Var | Optional | Rate-limit window. |
| `CACHE_TTL_SECONDS` | Var | Optional | Cache TTL for cacheable responses. |

## Feature map

| Legacy feature / requirement | New location |
|---|---|
| Dark SUGO SOP app shell | `public/index.html`, `public/css/styles.css` |
| Sidebar navigation | `public/index.html`, rendered by `public/js/app.js` from `public/js/content.js` |
| Root → Category → Section → Topic tree | `public/js/content.js`, rendered in `app.js` |
| 284 visible topics | `public/js/content.js` |
| 120 orphan panes | `public/js/content.js`, preserved and searchable |
| 37 dynamic macros | `public/js/content.js`, preserved and searchable |
| Bilingual SOP content | `public/js/content.js`, rendered in article route by `app.js` |
| Arabic RTL / English LTR content columns | `public/css/styles.css`, `public/js/app.js` |
| Article detail route | `public/js/app.js`, `public/index.html` |
| Welcome screen | `public/index.html`, `public/js/app.js` |
| Sidebar search | `public/js/app.js` consolidated search index |
| Arabic-aware search normalization | `public/js/app.js` |
| Search results overlay/panel | `public/index.html`, `public/js/app.js` |
| Favorites | `public/js/app.js`, localStorage key `sugo_favorite_panes_v1` |
| Recently used | `public/js/app.js`, localStorage key `sugo_recent_panes_v1` |
| Navigation state persistence | `public/js/app.js`, localStorage key `sugo_nav_state_v2` with legacy `sugo_last_pane` support |
| Content language filters | `public/js/app.js`, localStorage key `sugo_content_view_v1` |
| Field-type filters | `public/js/app.js` |
| Internal/customer visibility filters | `public/js/app.js` |
| Plain copy | `public/js/app.js` clipboard utilities |
| Rich/HTML copy | `public/js/app.js` ClipboardItem fallback utility |
| Ask AI workspace | `public/index.html`, `public/js/app.js`, `public/css/styles.css` |
| Response-mode toggle | Ask AI route in `public/js/app.js` |
| Output-type toggle | Ask AI route in `public/js/app.js` |
| SOP mode toggle | Ask AI route in `public/js/app.js` |
| Streaming AI responses | `public/js/app.js` SSE parser calling Worker `POST /` |
| Stop generation | `public/js/app.js` AbortController integration |
| Regenerate answer | `public/js/app.js` |
| Create ticket from AI answer | `public/js/app.js` ticket-output request flow |
| Markdown rendering | `public/js/app.js` dependency-free renderer |
| Per-answer RTL/LTR detection | `public/js/app.js` direction detector |
| AI answer audit/confidence panel | Ask AI preview panel in `public/js/app.js` |
| AI answer favorites | `public/js/app.js`, localStorage key `sugo_favorite_ai_answers_v1` |
| Generated ticket favorites | `public/js/app.js`, localStorage key `sugo_favorite_ai_tickets_v1` |
| Quick Access drawer | `public/index.html`, `public/js/app.js` |
| Quick Access tabs | `public/js/app.js`, localStorage keys `sugo_quick_access_tab_v1`, `sugo_quick_access_open_v1` |
| Create Ticket workspace | `public/index.html`, `public/js/app.js`, `public/css/styles.css` |
| Ticket type cards | Create Ticket route in `public/js/app.js` |
| Ticket detail fields | Create Ticket route in `public/js/app.js` |
| Live ticket preview | Create Ticket preview panel in `public/js/app.js` |
| Ticket draft persistence | `public/js/app.js`, localStorage key `sugo_ticket_workspace_v1` |
| Upload Image workspace | `public/index.html`, `public/js/app.js`, `public/css/styles.css` |
| Drag-and-drop image upload | Upload Image route in `public/js/app.js` |
| Image preview and validation | Upload Image route in `public/js/app.js` |
| Structured image prompt builder | Upload Image route in `public/js/app.js` |
| Vision analysis Worker payload | `public/js/app.js` sends `task_type: "image_analysis"` and `images` |
| Admin editable content hooks | Admin route in `public/js/app.js` |
| `GET /menu` | Worker endpoint used by Admin Hooks |
| `GET /content` | Worker endpoint used by Admin Hooks |
| `GET /diagnostics` | Worker endpoint used by Admin Hooks |
| `POST /admin/menu` | Worker endpoint used by Admin Hooks with `Authorization: Bearer <ADMIN_PASSWORD>` |
| `POST /admin/content` | Worker endpoint used by Admin Hooks with authorization |
| `POST /admin/pane` | Worker endpoint used by Admin Hooks with authorization |
| `POST /admin/pane/reset` | Worker endpoint used by Admin Hooks with authorization |
| Mobile responsive layout | `public/css/styles.css`, `public/js/app.js` |
| Mobile sidebar drawer | `public/index.html`, `public/css/styles.css`, `public/js/app.js` |
| Accessibility skip link | `public/index.html`, `public/css/styles.css` |
| Focus-visible states | `public/css/styles.css` |
| Escape close for drawers | `public/js/app.js` |
| Reduced motion support | `public/css/styles.css` |
| Existing Worker AI provider fallback | `worker/worker.js` |
| Existing Worker KV content/menu storage | `worker/worker.js`, `worker/wrangler.toml` |
| Existing Worker health/diagnostics | `worker/worker.js` |
| Accepted known gaps from Stage 19 | `docs/INTENTIONAL_DIFFERENCES.md`, `docs/REGRESSION_CHECKLIST.md` |
| Phase 21 consistency audit | `docs/PHASE_21_CONSISTENCY_AUDIT.md` |

## Known differences

See `docs/INTENTIONAL_DIFFERENCES.md` and `docs/REGRESSION_CHECKLIST.md`. These were disclosed in Stage 19 and carried into the final package after approval to proceed.

## GitHub initialization commands

From the folder that contains `sugo-sop/`:

```bash
cd sugo-sop
git init
git add .
git commit -m "Initial commit — SUGO SOP rebuild"
git branch -M main
git remote add origin <YOUR_NEW_GITHUB_REPO_URL>
git push -u origin main
```
