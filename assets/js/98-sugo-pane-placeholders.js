/* SUGO Split Placeholder Store — keeps original code checks working without loading full SOP HTML. */
(function(){
  'use strict';
  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }
  try { if (typeof paneContent !== 'undefined') window.paneContent = paneContent; } catch(e) {}
  try { if (typeof setPane === 'function') window.setPane = setPane; } catch(e) {}
  try {
    if (typeof paneContent === 'undefined') return;
    var rows = Array.isArray(window.SUGO_TOPIC_INDEX_RAW) ? window.SUGO_TOPIC_INDEX_RAW : [];
    rows.forEach(function(t){
      var id = t && t.id;
      if(!id || paneContent[id]) return;
      var preview = [t.title, t.category, t.section, t.path, t.text].filter(Boolean).join('\n');
      paneContent[id] = {
        en: '<div class="doc-card sugo-lazy-placeholder" data-sugo-lazy-placeholder="1">' +
            '<p><strong>Loading SOP article…</strong></p>' +
            '<div style="display:none" aria-hidden="true">' + esc(preview) + '</div>' +
            '</div>',
        __lazyPlaceholder: true
      };
    });
    window.SUGO_LAZY_PLACEHOLDERS_READY = true;
  } catch(e) { console.warn('SUGO placeholders could not be installed', e); }
})();
