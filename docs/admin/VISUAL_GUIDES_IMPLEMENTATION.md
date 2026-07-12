# Visual Guides Implementation

## Completed

- Added `js/kb-media.js` as the dedicated screenshot-to-SOP mapping layer.
- Added 103 visual guides containing 142 PNG screenshots.
- Linked the guides to 85 existing SOP topic IDs without duplicating navigation pages.
- Added a camera badge to every navigation topic that has linked screenshots.
- Added inline **Visual Reference** sections to SOP articles.
- Single-image guides render as one visual reference.
- Multi-image guides render as numbered steps in the correct file order.
- Added a full-screen lightbox with close, previous, next, Escape, Left Arrow, and Right Arrow controls.
- Added lazy image loading and asynchronous image decoding.
- Added **Related Visual Guides** to Ask AI results using the matched KB topics.
- Added **Related Visual Guides** to Create Ticket results using the matched KB topics.
- Added `window.SUGO.VisualGuides` for controlled runtime access and diagnostics.

## Counts

- Visual guides: 103
- Screenshots: 142
- Linked SOP topic IDs: 85

## Main files

- `js/kb-media.js`
- `js/app.js`
- `css/styles.css`
- `assets/screenshots/`
- `VISUAL_GUIDES_MAPPING.md`

## Admin-managed visual guides update

Build `20260712-admin-media-v2` adds Cloudflare KV-backed image management to the existing static visual-guide system. `kb-media.js` now merges the bundled guide catalog with topic-specific overrides loaded from `GET /media`. The topic editor can create those overrides and restore the original bundled version.
