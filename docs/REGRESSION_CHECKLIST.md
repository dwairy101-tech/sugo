# Build Stage 19 — Full Regression Checklist vs. Old File

## Scope

This checkpoint compares the current rebuilt files against the Build Stage 1 inventory. No runtime feature implementation was added in this stage; the Stage 18 app files were copied forward unchanged and audited.

## Content and navigation regression

| Item | Expected from Stage 1 | Current rebuild | Status |
|---|---:|---:|---|
| Root knowledgebases | 2 | 2 | ✅ |
| Categories | 16 | 16 | ✅ |
| Sections | 72 | 72 | ✅ |
| Visible topics | 284 | 284 | ✅ |
| Unique visible pane IDs | 284 | 284 | ✅ |
| Duplicate visible pane IDs | 0 | 0 | ✅ |
| Total tracked pane records | 414 | 414 | ✅ |
| Orphan panes preserved | 120 | 120 | ✅ |
| Dynamic macros tracked | 37 | 37 | ✅ |
| Dynamic macros visible in nav | 27 | 27 | ✅ |
| Dynamic macros not visible in nav | 10 | 10 | ✅ |
| Visible panes missing content | 0 | 0 | ✅ |
| Panes without content object | 0 | 0 | ✅ |
| Panes without migrated fields | 0 | 0 | ✅ |

Total migrated SOP fields counted across EN/AR records: **1337**.

## Feature regression checklist

| Feature area | Status | Evidence / gap |
|---|---|---|
| Opening splash | ❌ | No splash/boot screen implementation found in the current rebuild. |
| Theme layers | ✅ | Single styles.css token/component system; no old blue theme carried forward. |
| App shell | ✅ | app-sidebar, app-main, workspaceTitle, routeOutlet, workspacePreview are present. |
| Library switcher | ✅ | Both roots rendered from data model: SUGO Knowledgebase — MENA and SUGO SV. |
| Hierarchical navigation | ✅ | 2 roots / 16 categories / 72 sections / 284 topics. |
| Cascade navigation | ❌ | Separate legacy cascade/dropdown selector was not rebuilt. |
| Pane router | ✅ | welcome/topic/saved/ask_ai/create_ticket/upload_image/admin routes with sugo_nav_state_v2 and sugo_last_pane fallback. |
| Breadcrumb | ✅ | workspaceBreadcrumbs and route update functions are present. |
| Search input | ✅ | Arabic/English search index over 414 records with debounced live results. |
| Search engines | ✅ | Old stacked engines replaced by one runSearch implementation. |
| Keyword routing | ⚠️ | Search normalization/matching and KB matches exist; explicit legacy intent-group alias table was not fully restored. |
| Best-match panel | ⚠️ | Search results and KB match payload exist; no separate legacy Best Match card/panel is present. |
| Favorites | ✅ | sugo_favorite_panes_v1 implemented. |
| Recently used | ✅ | sugo_recent_panes_v1 implemented. |
| Quick access drawer | ✅ | Favorites / Recent / AI Answers / Tickets tabs and persistence implemented. |
| Content cards | ✅ | Bilingual EN/LTR and AR/RTL SOP content cards render from migrated panes. |
| Content filters | ⚠️ | Language/type/visibility filters implemented under sugo_content_view_v1, not legacy sugo_content_filter_<group> keys. |
| Internal/external separation | ✅ | Field metadata and internal/customer-facing visibility filters exist. |
| Copy buttons | ✅ | Plain/rich copy at visible, language, and field levels. |
| Rich/plain extraction | ✅ | copyPlainText and copyRichContent helpers present. |
| Direction handling | ✅ | SOP AR/EN and AI answer direction detection/rendering implemented. |
| Ask AI Workspace | ✅ | Ask AI workspace, controls, composer, local state and backend integration present. |
| AI backend calls | ✅ | POST / payload, SSE stream parser, JSON fallback, AbortController, Retry-After handling. |
| AI answer pane | ✅ | Markdown rendering, direction detection, copy/favorite/regenerate/ticket actions. |
| AI audit panel | ✅ | Confidence, matched SOP context, ambiguity and provider metadata panel. |
| Ticket-builder panel | ✅ | Create Ticket workspace and ticket-from-answer flow exist. |
| AI favorites | ✅ | sugo_favorite_ai_answers_v1 and sugo_favorite_ai_tickets_v1 implemented. |
| Create Ticket Workspace | ✅ | Ticket type cards, form, live preview, templates, local draft persistence. |
| Upload Image Workspace | ✅ | Dropzone, preview, prompt builder, Worker image_analysis payload and streaming result. |
| Sidebar upload shortcut | ⚠️ | Sidebar workspace button exists; small legacy inline uploader/preview in the sidebar was not restored. |
| Presets | ❌ | sugo_ready_preset is not present in the rebuild. |
| Answer density | ❌ | sugo_answer_density is not present in the rebuild. |
| Options compacting | ❌ | sugo_options_open is not present in the rebuild. |
| UI options persistence | ❌ | sugo_ui_language, sugo_output_type, sugo_sop_mode, sugo_response_mode legacy keys are not present. |
| Integrated menu cache | ❌ | sugo_integrated_menu_v1_cache is not present; admin fetch hooks exist but not the old cache key. |
| Admin/edit hooks | ✅ | GET/POST admin hooks and Bearer Authorization implemented. |
| Responsive behavior | ✅ | Mobile app bar, off-canvas sidebar, tablet/mobile media queries. |
| Accessibility basics | ✅ | Skip link, focus trap, Escape close, ARIA dialog, reduced motion. |

## LocalStorage compatibility

### Keys present in old frontend but not present in current rebuild

- `sugo_ai_recent_questions`
- `sugo_answer_density`
- `sugo_content_filter_`
- `sugo_integrated_menu_v1_cache`
- `sugo_menu_refresh_once`
- `sugo_options_open`
- `sugo_output_type`
- `sugo_ready_preset`
- `sugo_response_mode`
- `sugo_sop_mode`
- `sugo_ui_language`

These are the main compatibility gaps to resolve before final delivery if exact legacy localStorage behavior remains non-negotiable.

## Summary

- ✅ Passed feature areas: **27**
- ⚠️ Partial feature areas: **4**
- ❌ Missing feature areas: **7**
- Content/navigation migration: **PASS**
- Functional parity: **NOT YET FINAL** because Stage 19 found partial/missing legacy behaviors listed above.

## Recommended action before Build Stage 20

Resolve or explicitly waive the ❌/⚠️ items before final delivery. The biggest gaps are: opening splash, cascade selector, presets, answer-density/options persistence, legacy UI option keys, integrated menu cache, and the sidebar inline image uploader/preview shortcut.
