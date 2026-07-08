(function(){
  'use strict';
  var FAV_KEY = 'sugo_favorite_panes_v1';
  var RECENT_KEY = 'sugo_recent_panes_v1';
  var MAX_RECENT = 10;
  var MAX_FAV_DISPLAY = 16;
  var originalShowPane = null;
  var wrapping = false;

  function safeParse(value, fallback){
    try { var parsed = JSON.parse(value || ''); return Array.isArray(parsed) ? parsed : fallback; }
    catch(e){ return fallback; }
  }
  function readList(key){ return safeParse(localStorage.getItem(key), []); }
  function writeList(key, list){ try { localStorage.setItem(key, JSON.stringify(list || [])); } catch(e){} }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).filter(function(id){
      id = String(id || '').trim();
      if(!id || seen[id] || !(typeof paneContent !== 'undefined' && paneContent[id])) return false;
      seen[id] = true;
      return true;
    });
  }
  function getNavButton(paneId){ return document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    try {
      if(typeof getAllTopics === 'function'){
        var t = getAllTopics().find(function(item){ return item.id === paneId; });
        if(t && (t.title || t.label)) return String(t.title || t.label).trim();
      }
    } catch(e){}
    return paneId.replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
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
  function escapeHtml(value){ return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function isFavorite(paneId){ return readList(FAV_KEY).indexOf(paneId) >= 0; }
  function setFavorite(paneId, enabled){
    var list = uniquePaneList(readList(FAV_KEY));
    var idx = list.indexOf(paneId);
    if(enabled && idx < 0) list.unshift(paneId);
    if(!enabled && idx >= 0) list.splice(idx, 1);
    writeList(FAV_KEY, list);
    refreshLists();
    updatePaneFavoriteBar(paneId);
  }
  function toggleFavorite(paneId){ setFavorite(paneId, !isFavorite(paneId)); }
  function recordRecent(paneId){
    if(!paneId || !(typeof paneContent !== 'undefined' && paneContent[paneId])) return;
    var list = uniquePaneList(readList(RECENT_KEY)).filter(function(id){ return id !== paneId; });
    list.unshift(paneId);
    writeList(RECENT_KEY, list.slice(0, MAX_RECENT));
    refreshLists();
  }
  function makeItem(paneId, kind){
    var title = getPaneTitle(paneId);
    var path = getPanePath(paneId);
    var removable = kind === 'favorite';
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + escapeHtml(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-' + escapeHtml(kind) + '">' + (kind === 'favorite' ? 'F' : 'R') + '</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + escapeHtml(title) + '</span><span class="sugo-fr-path">' + escapeHtml(path) + '</span></span>' +
      (removable ? '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + escapeHtml(paneId) + '" title="Remove favorite">×</span>' : '<span></span>') +
      '</button>';
  }
  function refreshLists(){
    var favBox = document.getElementById('sugoFavoritesList');
    var recentBox = document.getElementById('sugoRecentList');
    if(!favBox || !recentBox) return;
    var favs = uniquePaneList(readList(FAV_KEY)).slice(0, MAX_FAV_DISPLAY);
    var recents = uniquePaneList(readList(RECENT_KEY)).slice(0, MAX_RECENT);
    favBox.innerHTML = favs.length ? favs.map(function(id){ return makeItem(id, 'favorite'); }).join('') : '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Add Favorite.</div>';
    recentBox.innerHTML = recents.length ? recents.map(function(id){ return makeItem(id, 'recent'); }).join('') : '<div class="sugo-fr-empty">Recently opened macros will appear here.</div>';
  }
  function updatePaneFavoriteBar(paneId){
    var pane = document.getElementById('pane-' + paneId);
    if(!pane) return;
    var card = pane.querySelector('.doc-card');
    if(!card) return;
    var bar = card.querySelector(':scope > .sugo-fr-cardbar');
    if(!bar){
      bar = document.createElement('div');
      bar.className = 'sugo-fr-cardbar';
      bar.setAttribute('data-pane-id', paneId);
      card.insertBefore(bar, card.firstChild);
    }
    var active = isFavorite(paneId);
    bar.innerHTML = '<div class="sugo-fr-cardmeta"><div class="sugo-fr-cardtitle">' + escapeHtml(getPaneTitle(paneId)) + '</div><div class="sugo-fr-cardpath">' + escapeHtml(getPanePath(paneId)) + '</div></div>' +
      '<button type="button" class="sugo-fr-favbtn' + (active ? ' active' : '') + '" data-sugo-fav-toggle="' + escapeHtml(paneId) + '"><span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function wrapShowPane(){
    if(wrapping) return;
    var fn = window.showPane;
    if(typeof fn !== 'function') return;
    if(fn.__sugoFavoritesWrapped) return;
    wrapping = true;
    originalShowPane = fn;
    window.showPane = function(paneId, save){
      var result = originalShowPane.apply(this, arguments);
      try { recordRecent(paneId); updatePaneFavoriteBar(paneId); } catch(e){}
      return result;
    };
    window.showPane.__sugoFavoritesWrapped = true;
    try { showPane = window.showPane; } catch(e){}
    wrapping = false;
  }
  function installClickHandlers(){
    document.addEventListener('click', function(event){
      var remove = event.target.closest && event.target.closest('[data-sugo-fr-remove]');
      if(remove){
        event.preventDefault(); event.stopPropagation();
        setFavorite(remove.getAttribute('data-sugo-fr-remove'), false);
        return;
      }
      var fav = event.target.closest && event.target.closest('[data-sugo-fav-toggle]');
      if(fav){
        event.preventDefault(); event.stopPropagation();
        toggleFavorite(fav.getAttribute('data-sugo-fav-toggle'));
        return;
      }
      var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
      if(open){
        event.preventDefault(); event.stopPropagation();
        var paneId = open.getAttribute('data-sugo-fr-open');
        if(paneId && typeof window.showPane === 'function') window.showPane(paneId, true);
        return;
      }
      var clear = event.target.closest && event.target.closest('#sugoClearRecentBtn');
      if(clear){
        event.preventDefault(); event.stopPropagation();
        writeList(RECENT_KEY, []);
        refreshLists();
      }
    }, true);
  }
  function refreshActiveBar(){
    var active = document.querySelector('.content-pane.active');
    if(active && active.id && active.id.indexOf('pane-') === 0) updatePaneFavoriteBar(active.id.replace(/^pane-/, ''));
  }
  function boot(){
    if(!document.getElementById('sugoFavRecentPanel')) return;
    wrapShowPane();
    installClickHandlers();
    refreshLists();
    refreshActiveBar();
    setTimeout(refreshLists, 250);
    setTimeout(refreshActiveBar, 300);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ wrapShowPane(); refreshLists(); refreshActiveBar(); });
  window.SUGOFavoritesRecent = { refresh: refreshLists, recordRecent: recordRecent, toggleFavorite: toggleFavorite };
})();
