# Create Ticket — Apology Style and Action Layout

Build: `20260712-ticket-apology-layout-v1`

## Changes

- Added **Apology style** to Create Ticket.
- Buttons remain in English:
  - **Without Apology** (default)
  - **With Apology**
- The selected option applies to both English and Arabic ticket output.
- **With Apology** inserts exactly one short apology in the selected language.
- **Without Apology** removes apology wording from the final customer-facing ticket.
- Internal escalation notes never receive a customer apology.
- Reorganized action buttons:
  - **Generate Ticket** uses the full primary row.
  - **Copy Ticket** and **Clear** use a balanced second row after a ticket is generated.
- Added cache-busting build version to `index.html` and `404.html`.

## Deployment

This is a front-end update. Upload the project files to GitHub Pages. Cloudflare Worker redeployment is not required.
