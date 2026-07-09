# SUGO SOP Portal

Final clean rebuild of the SUGO SOP bilingual knowledge-base, AI assistant, ticket-drafting, and image-analysis portal.

## Status

Phase 20 complete. The static frontend is rebuilt as a small GitHub-ready codebase, the existing Cloudflare Worker is copied unchanged, the worker-facing request/response contract was rechecked, and English/Arabic visual QA was run across the completed screens.

## Folder structure

```text
sugo-sop/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── kb-data.js
│       ├── kb-content.js
│       └── app.js
├── worker/
│   ├── worker.js
│   └── wrangler.toml
├── README.md
└── .gitignore
```

## Local preview

Open `public/index.html` directly in a browser, or serve the folder with any static server:

```bash
cd public
python -m http.server 8080
```

Then open the local server address in the browser.

## Worker deployment

```bash
cd worker
wrangler deploy
```

Before deployment, replace the placeholder KV namespace ID in `worker/wrangler.toml` and set required secrets with `wrangler secret put`.

## Required Cloudflare Worker bindings and secrets

| Name | Type | Purpose |
| --- | --- | --- |
| `SUGO_KV` | KV namespace binding | Stores menu/content/admin pane data used by the existing worker. |
| `GEMINI_API_KEY` | Secret | Gemini provider key used by the existing worker fallback chain. |
| `CEREBRAS_API_KEY` | Secret | Cerebras provider key used by the existing worker fallback chain. |
| `GROK_API_KEY` | Secret | Grok provider key used by the existing worker fallback chain. |
| `ADMIN_PASSWORD` | Secret | Bearer-token password for admin menu/content/pane endpoints. |

## Frontend ↔ Worker contract

The frontend AI calls post JSON to the Worker base URL, not to `/chat` or `/api`. The rebuilt frontend preserves the legacy body fields:

- `task_type`
- `workspace`
- `max_completion_tokens`
- `response_mode`
- `output_type`
- `language`
- `sop_mode`
- `kb_matches`
- `kb_confidence`
- `kb_confidence_score`
- `kb_ambiguous`
- `kb_primary_route`
- `kb_query_intents`
- `has_image`
- `images`
- `image`
- `cache`
- `stream`
- `messages`

The supported task/workspace combinations are:

| UI workspace | `task_type` | `workspace` | `output_type` | Image fields |
| --- | --- | --- | --- | --- |
| Create Ticket | `create_ticket` | `create_ticket` | `ticket` | `has_image: false`, `cache: true` |
| Ask AI | `ask_ai` | `ask_ai` | `answer` | `has_image: false`, `cache: true` |
| Upload Image | `image_analysis` | `upload_image` | `answer` or `ticket` | `has_image: true`, `images[]`, duplicate `image`, `cache: false` |

All AI requests use `Content-Type: application/json`, `stream: false`, an `AbortController` timeout, the client-side KB matcher, and both response parsers:

- `text/event-stream` line parsing for `data:` payloads.
- OpenAI-style JSON parsing from `choices[0].message.content`.

Reserved Worker routes remain:

- `GET /menu`
- `GET /content`
- `POST /admin/menu`
- `POST /admin/content`
- `POST /admin/pane`
- `POST /admin/pane/reset`
- `GET /health`
- `GET /diagnostics`
- `OPTIONS *`

Admin endpoint compatibility wrappers are exposed at `window.SUGO.workerAdminAPI` and use `Authorization: Bearer <password>` for admin POST calls. No visible admin editing screen was added because the target screenshot did not define placement for that UI.

## Feature Map

| Legacy / required feature | New location | Status |
| --- | --- | --- |
| Repository scaffold | Project root, `public/`, `worker/` | Complete |
| Design-system foundation | `public/css/styles.css` | Complete |
| App shell layout | `public/index.html`, `public/css/styles.css` | Complete |
| Top header bar and brand lockup | `public/index.html`, `public/css/styles.css` | Complete |
| Header language toggle | `public/index.html`, `public/js/app.js` | Complete |
| Sidebar top controls | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Sidebar Favorites & Recent panels | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Sidebar Menu shell | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Knowledgebase source switcher | `public/index.html`, `public/js/app.js` | Complete |
| Knowledgebase nested navigation tree | `public/js/kb-data.js`, `public/js/app.js` | Complete |
| Extracted pane/article bodies | `public/js/kb-content.js` | Complete, 404 unique pane bodies |
| Hidden panes retained for search/matching | `public/js/kb-data.js`, `public/js/kb-content.js` | Complete, 120 hidden panes |
| Client-side KB matcher | `public/js/app.js` | Complete |
| Create Ticket type selector | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Create Ticket details form | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Create Ticket rich description field | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Create Ticket attachments | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Create Ticket live preview | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| AI-to-ticket population link | `public/js/app.js` | Complete |
| Worker-compatible Create Ticket AI draft | `public/js/app.js` | Complete |
| Ask AI redesigned console | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Upload Image / vision console | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Local image compression and payload prep | `public/js/app.js` | Complete |
| KB article detail view | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Global search / command palette | `public/index.html`, `public/css/styles.css`, `public/js/app.js` | Complete |
| Service Catalog placeholder | `public/index.html`, `public/js/app.js` | Visual shell only |
| My Tickets placeholder | `public/index.html`, `public/js/app.js` | Visual shell only |
| Approvals placeholder | `public/index.html`, `public/js/app.js` | Visual shell only |
| Announcements placeholder | `public/index.html`, `public/js/app.js` | Visual shell only |
| Help & Support placeholder | `public/index.html`, `public/js/app.js` | Visual shell only |
| Admin endpoint wrappers | `public/js/app.js` | Compatibility wrapper only, no visible screen |
| Existing Cloudflare Worker | `worker/worker.js` | Copied unchanged |
| Wrangler deploy template | `worker/wrangler.toml` | Complete |

## Knowledgebase extraction summary

- Roots: 2
- Visible navigation topics: 284
- Content pane IDs carried in metadata: 404
- Hidden/non-navigation pane IDs retained for search/content matching: 120
- The tree data lives in `public/js/kb-data.js`.
- Article bodies live in `public/js/kb-content.js`.

## QA summary

Final automated/browser QA was run with Chromium against `public/index.html`.

Checked:

- Create Ticket screen.
- Ask AI screen.
- Upload Image screen.
- Knowledgebase article view.
- Search overlay.
- Service Catalog, My Tickets, Approvals, Announcements, Help & Support placeholders.
- English `ltr` and Arabic `rtl` language states.
- Worker request payload shapes for Create Ticket, Ask AI, and Upload Image.
- JavaScript syntax for `app.js`, `kb-data.js`, and `kb-content.js`.
- Worker file SHA256 against the original extracted `worker.js`.

Results:

- Console errors: 0.
- Page errors: 0.
- Worker file unchanged: yes.
- AI request `stream`: `false`, with SSE parser still preserved.
- The only automated overflow sample was the intentionally hidden file input used by the attachment control; visible UI controls passed the final visual pass.

## Deployment checklist

1. Replace `REPLACE_WITH_SUGO_KV_NAMESPACE_ID` inside `worker/wrangler.toml`.
2. Set Worker secrets:
   - `wrangler secret put GEMINI_API_KEY`
   - `wrangler secret put CEREBRAS_API_KEY`
   - `wrangler secret put GROK_API_KEY`
   - `wrangler secret put ADMIN_PASSWORD`
3. Deploy the Worker from `worker/`.
4. Host the static frontend from `public/`.
5. If the Worker URL changes, update `CONFIG.workerUrl` inside `public/js/app.js` before publishing.

## Known scope boundaries

- The placeholder routes are visual shells only because no ticket database, approval workflow, announcement feed, or service catalog endpoint was confirmed in the legacy source.
- Admin endpoint wrappers are preserved for compatibility, but no visible admin editing screen was added without an approved target placement.
- The Cloudflare Worker logic was intentionally not rewritten.
