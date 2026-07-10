# SUGO SOP — GitHub Pages Ready

This package places the static frontend at the repository root so GitHub Pages serves the new application instead of an older root `index.html`.

## Required repository layout

```text
index.html
css/
js/
data/
worker/
.nojekyll
README.md
```

Do not upload the parent ZIP as one file. Extract it first, then upload the files and folders shown above directly to the repository root.

## GitHub Pages settings

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select the branch containing these files, usually `main`.
5. Select the folder **/(root)**.
6. Save and wait for deployment to complete.

If the repository still contains an older root `index.html`, replace or delete it before uploading this package.

The Cloudflare Worker remains in `worker/` and is not deployed by GitHub Pages.


## Crimson Noir build

This GitHub Pages build uses the approved desktop-only dark crimson, black, and gray theme. Article pages open with all available English/Arabic content and all content types visible by default.


## Build 20260710-crimson-format-v3

- Preserves paragraphs, headings, numbered steps, bullets, links, and line breaks from local and KV/admin content.
- Adds English/Arabic output-language selection to Ask AI, Create Ticket, and Upload Image.
