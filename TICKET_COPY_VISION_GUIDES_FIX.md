# Create Ticket Copy + Image Analysis Visual Guides Fix

Build: `20260712-ticket-copy-vision-guides-v1`

## Changes

1. Added a `Copy Ticket` button to the Create Ticket output panel.
   - Copies the generated customer-ready ticket only.
   - Shows `Copied` for 1.2 seconds after success.
   - Shows `Copy failed` if the browser blocks clipboard access.
   - Uses the same copy icon and interaction pattern as Ask AI and Upload Image.

2. Connected Upload Image / Image Analysis results to Visual Guides.
   - Uses the matched SOP topics returned by the knowledge-base matcher.
   - Displays `Related Visual Guides` below the image-analysis answer.
   - Supports static screenshots and images added later by the administrator.

3. Connected Vision Ticket results to Create Ticket media.
   - When Image Analysis output is set to Ticket, matched topics are passed into Create Ticket.
   - Opening Create Ticket afterwards shows the same related screenshots.

4. Added live refresh after media changes.
   - Ask AI, Create Ticket, and Upload Image refresh their related visual guides when admin media is loaded, changed, deleted, or restored.

## Deployment

These are front-end changes only. Upload the contents of this project to GitHub Pages. Cloudflare Worker redeployment is not required for this fix.
