# SUGO split optimized package

## Files
- `index.html` — the page you upload to GitHub Pages.
- `assets/css/main.css` — all CSS moved out of the HTML, with only the opening splash CSS kept inline.
- `assets/js/*.js` — JavaScript split into ordered chunks and loaded with `defer`.
- `worker.js` — your Cloudflare Worker file copied unchanged from the uploaded worker.

## Upload to GitHub
Upload the whole folder contents, not only `index.html`:

```
index.html
assets/
  css/main.css
  js/*.js
worker.js
```

Important: keep the `assets` folder paths exactly as they are.

## Why this is lighter
- The browser no longer parses one huge HTML file.
- CSS/JS can be cached separately after the first visit.
- `defer` prevents the heavy JavaScript chunks from blocking the initial HTML parsing.
- The opening splash still appears immediately because its critical CSS/JS stayed inline.

## Notes
- The Worker URL inside the page is unchanged: `https://sugo.dwairy101.workers.dev`.
- If you deploy a new Worker URL later, update `window.SUGO_WORKER_URL` or the Worker URL in the relevant JS chunk.
