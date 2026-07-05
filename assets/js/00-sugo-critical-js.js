// Extracted from index(94).html: <script id="sugo-critical-js">
// ===== id="sugo-opening-critical-js" =====

/* Mark booting before the body is painted, then release only after splash hides. */
document.documentElement.classList.add('sugo-booting');

// ===== id="sugo-options-default-closed-head" =====

/* Ensure OPTIONS is closed on every fresh file open, regardless of a previous browser session. */
try { localStorage.removeItem('sugo_options_open'); localStorage.removeItem('sugo_last_pane'); localStorage.removeItem('sugo_nav_state_v2'); } catch (e) {}
