# Intentional / Known Differences From Old Frontend

This file records differences carried into the final Stage 20 delivery after Stage 19 regression review.

## Fully preserved

- Navigation and content inventory is preserved.
- 284 visible topics are present.
- 414 tracked pane records are present.
- 120 orphan panes are preserved.
- 37 dynamic macros are preserved.
- Bilingual SOP body content is migrated for all tracked records.
- The frontend remains static and dependency-free.
- The existing Worker endpoints are called without changing the backend contract.

## Known gaps carried from Stage 19

The following were flagged in Stage 19 and remain known differences in this final package:

| Area | Status | Difference |
|---|---|---|
| Opening splash | Missing | The old splash/boot screen was not rebuilt. |
| Cascade navigation selector | Missing | The new app uses the rendered hierarchical sidebar, not the old separate cascade/dropdown selector. |
| Presets | Missing | `sugo_ready_preset` compatibility is not implemented. |
| Answer density | Missing | `sugo_answer_density` compatibility is not implemented. |
| Options compacting | Missing | `sugo_options_open` compatibility is not implemented. |
| Legacy UI option keys | Missing | `sugo_ui_language`, `sugo_output_type`, `sugo_sop_mode`, and `sugo_response_mode` legacy keys are not restored. |
| Integrated menu cache | Missing | `sugo_integrated_menu_v1_cache` is not restored; admin fetch/save hooks exist instead. |
| Keyword routing | Partial | Search normalization and KB match payload exist; the full legacy alias/intent-group routing table is not fully restored. |
| Best Match panel | Partial | Search results and KB matching exist; there is no separate legacy Best Match card/panel. |
| Content filter keys | Partial | New content filters use `sugo_content_view_v1` instead of legacy `sugo_content_filter_<group>` keys. |
| Sidebar inline uploader | Partial | The Upload Image workspace button exists; the old inline sidebar upload preview shortcut is not rebuilt. |

## Recommended future hardening

Before production cutover, either explicitly accept these differences in project documentation or schedule a parity patch cycle to restore the missing localStorage behaviors and legacy-only UI affordances.
