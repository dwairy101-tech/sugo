# SUGO split project

This is a split and performance-oriented version of the original one-file `index.html`.

## Main changes
- Original single HTML: 2,871,634 bytes.
- New `index.html`: 75,278 bytes.
- CSS moved to `assets/css/`: 175,607 bytes.
- Runtime JS moved to `assets/js/`: 635,206 bytes.
- SOP pane files moved to `assets/panes/`: 404 lazy files, 1,428,739 bytes total.
- Lightweight topic index: 376,253 bytes.
- Full all-panes bundle: 1,306,354 bytes and loads only when AI needs full SOP context.
- Worker copied to `worker.js` unchanged.

## Performance behavior
- Opening the app no longer injects all SOP pane HTML into memory at startup.
- Opening a topic loads only that topic's pane file.
- Asking AI loads `assets/data/all-panes.bundle.js` once so the AI can still use the full SOP content.
- This reduces startup parsing and memory pressure compared with the original single inline file.

## Upload structure for GitHub Pages
Upload the folder exactly like this:

```text
index.html
worker.js
assets/css/
assets/js/
assets/data/
assets/panes/
```

If your Worker URL changes later, update the `SUGO_WORKER_URL` value in the JS file where it is defined.

## v2 fix
- Added a lightweight placeholder store so original checks like `paneContent[paneId]` still work before the full SOP article is loaded.
- Moved manifest/topic index before hotfix scripts so Favorites, Recent, dropdowns, and search do not see an empty pane store.
- Lazy loader now invalidates search/AI caches after a pane or the full SOP bundle loads.
