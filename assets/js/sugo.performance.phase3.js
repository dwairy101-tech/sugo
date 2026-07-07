/* SUGO Phase 3 Performance Manager — final runtime guard
   - Keeps only a few opened panes in DOM.
   - Keeps only a small LRU HTML cache in memory.
   - Provides a safe startup search handler before heavy optional search code loads.
   - Avoids repeated layout work while typing. */
(function(){
  if (window.SUGO_PHASE3_PERFORMANCE) return;
  window.SUGO_PHASE3_PERFORMANCE = true;

  var CONFIG = {
    maxDomPanes: 4,
    maxMemoryPanes: 10,
    searchDebounceMs: 150,
    cleanupDelayMs: 650
  };
  var paneLastUsed = Object.create(null);
  var cleanupTimer = null;
  var searchTimer = null;
  var lastSearchValue = '';

  function now(){ return Date.now ? Date.now() : +new Date(); }
  function safePaneId(id){ return String(id || '').replace(/[^a-zA-Z0-9_-]/g, ''); }
  function paneIdFromElement(el){
    if(!el || !el.id) return '';
    return safePaneId(String(el.id).replace(/^pane-/, ''));
  }
  function markPane(id){
    id = safePaneId(id);
    if(!id) return;
    paneLastUsed[id] = now();
    var el = document.getElementById('pane-' + id);
    if(el) el.dataset.lastUsed = String(paneLastUsed[id]);
  }
  function activePaneId(){
    var active = document.querySelector('.content-pane.active');
    return paneIdFromElement(active);
  }
  function scheduleCleanup(){
    clearTimeout(cleanupTimer);
    cleanupTimer = setTimeout(runCleanup, CONFIG.cleanupDelayMs);
  }
  function removePaneElement(el){
    if(!el || el.classList.contains('active')) return;
    var id = paneIdFromElement(el);
    try { el.remove(); } catch(e) { if(el.parentNode) el.parentNode.removeChild(el); }
    try { if(typeof renderedPanes !== 'undefined' && renderedPanes && renderedPanes.delete) renderedPanes.delete(id); } catch(e) {}
  }
  function pruneDomPanes(){
    var panes = Array.prototype.slice.call(document.querySelectorAll('.content-pane[data-lazy="1"]'))
      .filter(function(el){ return !el.classList.contains('active'); });
    if(panes.length <= CONFIG.maxDomPanes) return;
    panes.sort(function(a,b){
      return Number(a.dataset.lastUsed || paneLastUsed[paneIdFromElement(a)] || 0) - Number(b.dataset.lastUsed || paneLastUsed[paneIdFromElement(b)] || 0);
    });
    while(panes.length > CONFIG.maxDomPanes){ removePaneElement(panes.shift()); }
  }
  function prunePaneMemory(){
    try{
      if(typeof paneContent === 'undefined' || !paneContent) return;
      var active = activePaneId();
      var ids = Object.keys(paneContent).filter(function(id){ return id !== active; });
      if(ids.length <= CONFIG.maxMemoryPanes) return;
      ids.sort(function(a,b){ return Number(paneLastUsed[a] || 0) - Number(paneLastUsed[b] || 0); });
      while(ids.length > CONFIG.maxMemoryPanes){
        var id = ids.shift();
        try { delete paneContent[id]; } catch(e) {}
        try { if(typeof sugoPaneLoadPromises !== 'undefined' && sugoPaneLoadPromises) delete sugoPaneLoadPromises[id]; } catch(e) {}
      }
    }catch(e){}
  }
  function runCleanup(){
    pruneDomPanes();
    prunePaneMemory();
  }

  function wrapGlobalFunction(name, wrapperFactory){
    try{
      var original = window[name];
      if(typeof original !== 'function' || original.__sugoPhase3Wrapped) return;
      var wrapped = wrapperFactory(original);
      if(typeof wrapped !== 'function') return;
      wrapped.__sugoPhase3Wrapped = true;
      window[name] = wrapped;
      try { eval(name + ' = window["' + name + '"];'); } catch(e) {}
    }catch(e){}
  }

  function installFunctionWraps(){
    wrapGlobalFunction('showPane', function(original){
      return function(paneId, save){
        markPane(paneId);
        var result = original.apply(this, arguments);
        markPane(paneId);
        scheduleCleanup();
        return result;
      };
    });
    wrapGlobalFunction('hydrateSugoPaneElement', function(original){
      return function(paneDiv, paneId, html){
        markPane(paneId);
        if(paneDiv) paneDiv.dataset.lastUsed = String(now());
        var result = original.apply(this, arguments);
        scheduleCleanup();
        return result;
      };
    });
  }

  // Safe search handler available at startup. The heavier precision search may replace it later.
  if(typeof window.sugoFastSearchInput !== 'function'){
    window.sugoFastSearchInput = function(el){
      if(!el) return;
      try{
        el.style.height = 'auto';
        el.style.height = Math.min(el.scrollHeight || 42, 160) + 'px';
      }catch(e){}
      lastSearchValue = String(el.value || '');
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function(){
        if(typeof window.doSearch === 'function') window.doSearch(lastSearchValue);
      }, lastSearchValue.trim() ? CONFIG.searchDebounceMs : 20);
    };
  }

  // Ask the loader to bring optional code only for actions that genuinely need it.
  document.addEventListener('keydown', function(ev){
    var target = ev.target;
    if(target && target.id === 'searchInput' && ev.key === 'Enter' && !ev.shiftKey && typeof window.SugoLoadPhase === 'function'){
      window.SugoLoadPhase('phase2');
    }
  }, true);
  document.addEventListener('click', function(ev){
    var t = ev.target;
    if(!t || !t.closest) return;
    if(t.closest('.ask-ai-btn, #createTicketBtn, [data-v51-search], [data-v52-search], .sugo-vision-upload, .sugo-vision-upload-btn')){
      if(typeof window.SugoLoadPhase === 'function') window.SugoLoadPhase('phase2');
    }
    if(t.closest('[data-sugo-edit-section], [data-sugo-tiny-plus], [data-sugo-fr-open], [data-sugo-fav-toggle], .admin-edit-button, .edit-section-btn')){
      if(typeof window.SugoLoadPhase === 'function') window.SugoLoadPhase('phase3');
    }
  }, true);

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installFunctionWraps, { once:true });
  else installFunctionWraps();
  window.addEventListener('load', function(){ installFunctionWraps(); scheduleCleanup(); }, { once:true });
  document.addEventListener('visibilitychange', function(){ if(document.hidden) runCleanup(); });

  window.SUGO_PHASE3_STATUS = {
    version: '3.0.0',
    mode: 'lazy-panes-lru-cache-service-worker',
    config: CONFIG,
    cleanup: runCleanup
  };
})();
