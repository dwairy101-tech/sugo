# SUGO SOP — Formatting and Language Audit

Build: `20260710-crimson-format-v3`

## Content formatting

- Preserves paragraph breaks from local knowledge-base content.
- Preserves block boundaries from legacy/KV HTML overrides (`p`, `div`, headings, lists, `br`, tables, and `pre`).
- Restores complete local content when a stale override is only a whitespace-collapsed or truncated copy of the same text.
- Displays standalone section headings as cards.
- Displays bullet points and numbered steps as real lists with visible markers.
- Applies Arabic RTL and English LTR direction to article and AI output text.
- Applies the formatting renderer across dual-language articles and support-macro fields.

## Output-language selection

English/Arabic output-language controls are present and wired to Worker requests in:

- Ask AI
- Create Ticket
- Upload Image

The selected value is sent in the exact `language` request field as `english` or `arabic`.

## Automated verification

- Ask AI language buttons: 2
- Create Ticket language buttons: 2
- Upload Image language buttons: 2
- Request languages verified: Arabic for all three workspaces
- Article headings/lists detected and rendered
- Complete missing section restored from local content when testing a truncated legacy override
- Menu Edit control present
- No JavaScript syntax errors
- No browser console errors
- No failed requests in the mocked integration test
- No horizontal page overflow at 1817 × 930
