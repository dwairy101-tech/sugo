# SUGO SOP Portal — GitHub Ready

A bilingual Arabic/English support portal with:

- 284 visible SOP topics and 73 hidden ticket macros.
- Ask AI, Create Ticket, and image-analysis workspaces.
- Precision routing for Arabic and English support queries.
- 142 bundled visual-guide images.
- Cloudflare Worker integration for AI, editable content, admin access, and KV image storage.
- Automated validation through `npm test` and GitHub Actions.

## Upload to GitHub Pages

1. Extract `SUGO_GITHUB_READY_20260712.zip`.
2. Upload **the extracted files and folders themselves** to the repository root. Do not upload the ZIP as a single file.
3. In GitHub, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main`, and select `/(root)`.
5. Save.

The required root layout begins with:

```text
.github/
assets/
css/
data/
docs/
js/
tests/
worker/
.nojekyll
404.html
index.html
package.json
README.md
```

The `worker/` directory is source code only; GitHub Pages does not deploy it as a Cloudflare Worker.

## Cloudflare Worker

The frontend currently reads its Worker URL from `js/config.js`.

To deploy or update your own Worker on Windows, run:

```text
START_CLOUDFLARE_SETUP.bat
```

The setup script:

- Reuses the Worker name `sugo`.
- Reuses the existing `SUGO_KV` binding when available.
- Keeps existing AI secrets by deploying with `--keep-vars`.
- Creates an administrator password only when one does not already exist.
- Updates `js/config.js` with the deployed Worker URL.
- Creates a complete GitHub upload ZIP.

Required Cloudflare secrets depend on the provider you use:

```text
ADMIN_PASSWORD
GEMINI_KEY_1        or GEMINI_API_KEY
CEREBRAS_KEY_1      or CEREBRAS_API_KEY
GROK_API_KEY        or XAI_API_KEY
```

Optional configuration is documented in `worker/env.example`.

## Validate before uploading

Node.js 20 or newer is required.

```bash
npm test
```

The validation suite checks:

- JavaScript syntax.
- Navigation/content coverage.
- All bundled image paths.
- Arabic precision routes such as country change, password reset, and account restriction.
- Arabic Create Ticket request settings.
- Duplicate-apology protection.
- Worker health, CORS, diagnostics authentication, HTML sanitization, and safe debug behavior.

GitHub Actions runs the same validation automatically on every push and pull request.

## Security notes

- Never commit `ADMIN_PASSWORD_READ_ME.txt`, `.dev.vars`, `.env`, API keys, or generated secret files.
- `/diagnostics` requires the administrator bearer password. `/health` remains public for deployment checks.
- Provider failure details are hidden by default. Set `DEBUG_ERRORS=true` only temporarily during controlled troubleshooting.
- Set `CORS_ORIGIN` to the exact GitHub Pages or custom-domain origin when possible. Multiple origins can be comma-separated.
- The Worker includes separate rate limits for public AI requests and administrator endpoints.

## Important external requirement

The repository is ready to upload, but live AI generation still depends on a deployed Cloudflare Worker with valid provider secrets and an active KV binding. Those external credentials cannot be verified from the offline ZIP alone.

## Documentation

- Arabic upload instructions: `GITHUB_UPLOAD_AR.md`
- Admin/media notes: `docs/admin/`
- Previous audit records: `docs/audits/`
- Legacy setup notes: `docs/setup/`
- Release changes: `CHANGELOG.md`
