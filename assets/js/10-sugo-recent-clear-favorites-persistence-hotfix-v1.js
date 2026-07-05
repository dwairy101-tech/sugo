// Extracted from index(94).html: <script id="sugo-recent-clear-favorites-persistence-hotfix-v1">
(function(){
  'use strict';

  if(window.__SUGO_RECENT_CLEAR_FAVORITES_PERSISTENCE_FIX_V1__) return;
  window.__SUGO_RECENT_CLEAR_FAVORITES_PERSISTENCE_FIX_V1__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_FAV_DISPLAY = 16;

  if(!window.CSS) window.CSS = {};
  if(typeof window.CSS.escape !== 'function'){
    window.CSS.escape = function(value){
      return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
    };
  }

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
  function paneExists(paneId){
    return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]);
  }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).filter(function(id){
      id = String(id || '').trim();
      if(!id || seen[id] || !paneExists(id)) return false;
      seen[id] = true;
      return true;
    });
  }
  function getNavButton(paneId){
    try{ return document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }
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
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function makeAiFavoriteItem(item){
    item = item || {};
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function renderFavoritesFromStorage(){
    var favBox = byId('sugoFavoritesList');
    if(!favBox) return;

    var paneFavorites = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var aiFavorites = readList(AI_FAV_KEY).filter(function(item){ return item && item.id; });
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
  }
  function updateQuickAccessCounts(){
    var favBox = byId('sugoFavoritesList');
    var recentBox = byId('sugoRecentList');
    var favCount = favBox ? favBox.querySelectorAll('.sugo-fr-item').length : 0;
    var recentCount = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
    var favCounter = byId('sugoFavCount');
    var recentCounter = byId('sugoRecentCount');
    if(favCounter) favCounter.textContent = favCount;
    if(recentCounter) recentCounter.textContent = recentCount;
  }
  function healFavoritesAfterRecentChange(){
    /*
      The original Recent Clear handler calls the base macro refresh directly.
      That refresh can temporarily replace the shared Favorites list with the
      "No favorites" empty state and skip generated-ticket favorites. Rebuild
      Favorites from localStorage immediately after that handler finishes.
    */
    renderFavoritesFromStorage();
    updateQuickAccessCounts();
  }
  function scheduleHeal(){
    setTimeout(healFavoritesAfterRecentChange, 0);
    setTimeout(healFavoritesAfterRecentChange, 80);
    setTimeout(healFavoritesAfterRecentChange, 250);
  }
  function install(){
    document.addEventListener('click', function(event){
      if(event.target.closest && event.target.closest('#sugoClearRecentBtn')){
        scheduleHeal();
        return;
      }
      if(event.target.closest && event.target.closest('[data-sugo-fr-tab="favorites"]')){
        scheduleHeal();
      }
    }, true);
    document.addEventListener('keydown', function(event){
      if(event.key !== 'Enter' && event.key !== ' ') return;
      if(event.target.closest && event.target.closest('[data-sugo-fr-tab="favorites"]')) scheduleHeal();
    }, true);
    setTimeout(healFavoritesAfterRecentChange, 400);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ setTimeout(healFavoritesAfterRecentChange, 700); });

  window.SUGORecentClearFavoritesFix = {
    version: '1.0.0',
    refreshFavorites: healFavoritesAfterRecentChange
  };
})();
