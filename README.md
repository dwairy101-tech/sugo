# SUGO SOP — Upload Ready

This package is prepared for direct upload to GitHub with `index.html` at the repository root.

## File tree

```text
sugo-upload-ready/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── content.js
│   └── app.js
├── worker/
│   ├── worker.js
│   └── wrangler.toml
├── docs/
├── .gitignore
├── .nojekyll
└── README.md
```

## Upload through GitHub web

1. Unzip the package.
2. Open the extracted folder.
3. Upload these items to the repository root:
   - `index.html`
   - `css/`
   - `js/`
   - `worker/`
   - `docs/`
   - `.gitignore`
   - `.nojekyll`
   - `README.md`
4. Commit the changes.

Do not upload the zip file itself.

## GitHub Pages

Because `index.html` is at the repository root, GitHub Pages can publish from:

```text
Settings → Pages → Build and deployment → Deploy from a branch → main / root
```

## Local preview

```bash
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## Cloudflare Worker

The Worker files are inside `worker/`.

Deploy later with:

```bash
cd worker
wrangler deploy
```

Before deployment, set secrets with Wrangler. See `worker/wrangler.toml` for the full list.

## Notes

The front-end is static and dependency-free. Live AI calls require the Cloudflare Worker/backend to be deployed and available according to the existing backend contract.
