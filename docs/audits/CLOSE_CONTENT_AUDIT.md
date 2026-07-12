# Close Content Audit

Build: `20260710-crimson-close-v4`

A single global close button is shown in the top-right header whenever any content is active. It closes and clears the visible workspace and right preview for:

- Knowledge-base topics
- Ask AI
- Create Ticket
- Upload Image
- Search results

Closing a view aborts any pending AI request, clears visual selection and breadcrumb, hides both content columns, and returns keyboard focus to the search field. Drafted inputs and completed AI output remain in memory so reopening a workspace restores the user's work.
