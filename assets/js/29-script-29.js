(function(){
  'use strict';
  if(window.__SUGO_TOPIC_OPEN_PERF_GUARD_V6__) return;
  window.__SUGO_TOPIC_OPEN_PERF_GUARD_V6__ = true;
  var original = window.showPane;
  if(typeof original === 'function' && !original.__sugoPerfMeasuredV6){
    window.showPane = function(paneId, save){
      var t0 = (performance && performance.now) ? performance.now() : Date.now();
      var result = original.apply(this, arguments);
      try{
        var active = 'pane-' + String(paneId || '');
        setTimeout(function(){
          document.querySelectorAll('.content-pane[data-lazy="1"]').forEach(function(p){ if(p.id !== active) p.remove(); });
          var dt = ((performance && performance.now) ? performance.now() : Date.now()) - t0;
          if(window.SUGO_DEBUG_PERF) console.log('[SUGO topic open]', paneId, Math.round(dt) + 'ms', 'panes:', document.querySelectorAll('.content-pane').length);
        }, 0);
      }catch(e){}
      return result;
    };
    window.showPane.__sugoPerfMeasuredV6 = true;
    try{ showPane = window.showPane; }catch(e){}
  }
})();
