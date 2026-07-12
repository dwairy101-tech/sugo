# Admin Media Manager — KV Edition

This build lets an administrator add, replace, reorder, caption, and delete SOP screenshots from **Edit topic**.

## Storage

- `SUGO_KV` stores article settings, image metadata, and the uploaded image files.
- Cloudflare R2 is not used and does not need to be activated.
- Each uploaded image is limited to 5 MB. PNG, JPG, and WebP are accepted.
- Unused uploaded files are deleted after the topic is saved or restored.

## Deployment

Run `START_CLOUDFLARE_SETUP.bat`. The script deploys the Worker, checks the admin password, updates `js/config.js`, and creates `SUGO_GITHUB_UPLOAD_READY.zip`.

## Admin use

1. Open a topic.
2. Choose **Edit topic**.
3. Open **Visual Guides**.
4. Add, replace, reorder, or delete images.
5. Enter English and Arabic captions.
6. Save changes.
7. Use **Restore original images** to remove the topic override and return to bundled screenshots.
