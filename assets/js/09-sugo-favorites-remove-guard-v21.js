(function(){
  'use strict';
  if(window.__SUGO_FAVORITES_REMOVE_GUARD_V21__) return;
  window.__SUGO_FAVORITES_REMOVE_GUARD_V21__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_FAV_DISPLAY = 16;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    return String(value || '').replace(/[&<>"']/g, function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];
    });
  }
  function readList(key){
    try{
      var list = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(list) ? list : [];
    }catch(e){ return []; }
  }
  function writeList(key, list){
    try{ localStorage.setItem(key, JSON.stringify(list || [])); }catch(e){}
  }
  function paneExists(paneId){
    try{ return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]); }
    catch(e){ return false; }
  }
  function uniquePaneList(list){
    var seen = Object.create(null);
    var out = [];
    (list || []).forEach(function(raw){
      var id = String(raw || '').trim();
      if(!id || seen[id] || !paneExists(id)) return;
      seen[id] = true;
      out.push(id);
    });
    return out;
  }
  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
  }
  function getNavButton(paneId){
    try{ return document.querySelector('.nav-l000-btn[data-pane="' + cssEscape(paneId) + '"]'); }
    catch(e){ return null; }
  }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    try{
      if(typeof window.getAllTopics === 'function'){
        var topics = window.getAllTopics();
        var topic = topics && topics.find(function(item){ return item && item.id === paneId; });
        if(topic && (topic.title || topic.label)) return String(topic.title || topic.label).trim();
      }
    }catch(e){}
    return String(paneId || '').replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var n0 = root && root.querySelector(':scope > .nav-lroot-btn > span');
    var n1 = l0 && l0.querySelector(':scope > .nav-l0-btn span');
    var n2 = l00 && l00.querySelector(':scope > .nav-l00-btn span');
    [n0,n1,n2].forEach(function(el){ if(el && el.textContent.trim()) parts.push(el.textContent.trim()); });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function makePaneFavoriteItem(paneId){
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + esc(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-favorite">F</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(getPaneTitle(paneId)) + '</span><span class="sugo-fr-path">' + esc(getPanePath(paneId)) + '</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function makeAiFavoriteItem(item){
    item = item || {};
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function updateCounts(){
    var favBox = byId('sugoFavoritesList');
    var recentBox = byId('sugoRecentList');
    var favCounter = byId('sugoFavCount');
    var recentCounter = byId('sugoRecentCount');
    if(favCounter) favCounter.textContent = favBox ? favBox.querySelectorAll('.sugo-fr-item').length : 0;
    if(recentCounter) recentCounter.textContent = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
  }
  function renderFavorites(){
    var favBox = byId('sugoFavoritesList');
    if(!favBox) return;

    var aiFavorites = readList(AI_FAV_KEY).filter(function(item){ return item && item.id; });
    var paneFavorites = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var html = '';

    if(aiFavorites.length){
      html += '<div class="sugo-fr-ai-label">Generated Tickets</div>' + aiFavorites.map(makeAiFavoriteItem).join('');
    }
    if(paneFavorites.length){
      html += paneFavorites.map(makePaneFavoriteItem).join('');
    }
    if(!html){
      html = '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Add Favorite.</div>';
    }
    favBox.innerHTML = html;
    updateCounts();
  }
  function setPaneBarInactive(paneId){
    try{
      var pane = byId('pane-' + paneId);
      if(!pane) return;
      var btn = pane.querySelector('[data-sugo-fav-toggle="' + cssEscape(paneId) + '"]');
      if(btn){
        btn.classList.remove('active');
        btn.innerHTML = '<span class="sugo-fr-badge">☆</span>Add Favorite';
      }
    }catch(e){}
  }
  function syncAiBar(){
    try{
      var bar = document.querySelector('.sugo-ai-favbar');
      if(!bar) return;
      var id = bar.getAttribute('data-ai-ticket-id');
      if(!id) return;
      var active = readList(AI_FAV_KEY).some(function(item){ return item && item.id === id; });
      var btn = bar.querySelector('[data-sugo-ai-fav-current]');
      if(btn){
        btn.classList.toggle('active', active);
        btn.innerHTML = '<span>' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite');
      }
    }catch(e){}
  }
  function removePaneFavorite(paneId){
    paneId = String(paneId || '').trim();
    if(!paneId) return;
    writeList(FAV_KEY, readList(FAV_KEY).filter(function(id){ return String(id || '').trim() !== paneId; }));
    setPaneBarInactive(paneId);
    renderFavorites();
  }
  function removeAiFavorite(id){
    id = String(id || '').trim();
    if(!id) return;
    writeList(AI_FAV_KEY, readList(AI_FAV_KEY).filter(function(item){ return item && String(item.id || '').trim() !== id; }));
    syncAiBar();
    renderFavorites();
  }
  function handleRemove(event){
    if(!event || !event.target || !event.target.closest) return;
    var paneRemove = event.target.closest('[data-sugo-fr-remove]');
    var aiRemove = event.target.closest('[data-sugo-ai-fav-remove]');
    if(!paneRemove && !aiRemove) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    if(aiRemove) removeAiFavorite(aiRemove.getAttribute('data-sugo-ai-fav-remove'));
    if(paneRemove) removePaneFavorite(paneRemove.getAttribute('data-sugo-fr-remove'));
  }

  document.addEventListener('click', handleRemove, true);
  document.addEventListener('keydown', function(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    handleRemove(event);
  }, true);

  window.SUGOFavoritesRemoveGuard = {
    version: '2.1.0',
    refresh: renderFavorites,
    removePaneFavorite: removePaneFavorite,
    removeAiFavorite: removeAiFavorite
  };
})();
