// Extracted from index(94).html: <script id="sugo-visible-favorite-button-js">
(function(){
  'use strict';
  if(window.__SUGO_VISIBLE_FAVORITE_BUTTON__) return;
  window.__SUGO_VISIBLE_FAVORITE_BUTTON__ = true;

  var FAV_KEY = 'sugo_favorite_panes_v1';
  var MAX_FAV_DISPLAY = 16;

  function byId(id){ return document.getElementById(id); }
  function safeParse(value){ try{ var parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; }catch(e){ return []; } }
  function readFavorites(){ return safeParse(localStorage.getItem(FAV_KEY)); }
  function writeFavorites(list){ try{ localStorage.setItem(FAV_KEY, JSON.stringify(list || [])); }catch(e){} }
  function paneStore(){ try{ return window.paneContent || paneContent || null; }catch(e){ return window.paneContent || null; } }
  function paneExists(paneId){ var store = paneStore(); return !!(paneId && store && store[paneId]); }
  function uniquePaneList(list){
    var seen = Object.create(null);
    return (list || []).map(function(id){ return String(id || '').trim(); }).filter(function(id){
      if(!id || seen[id] || !paneExists(id)) return false;
      seen[id] = true;
      return true;
    });
  }
  function isFavorite(paneId){ return uniquePaneList(readFavorites()).indexOf(String(paneId || '').trim()) >= 0; }
  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){ return '\\' + ch; });
  }
  function esc(value){ return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function getNavButton(paneId){ return document.querySelector('.nav-l000-btn[data-pane="' + cssEscape(paneId) + '"]'); }
  function getPaneTitle(paneId){
    var btn = getNavButton(paneId);
    if(btn && btn.textContent.trim()) return btn.textContent.trim();
    return String(paneId || '').replace(/^sv-refined-|^sv-clean-|^sv-/, '').replace(/-/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  function getPanePath(paneId){
    var btn = getNavButton(paneId);
    if(!btn) return 'SUGO SOP';
    var parts = [];
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    [root && root.querySelector(':scope > .nav-lroot-btn > span'), l0 && l0.querySelector(':scope > .nav-l0-btn span'), l00 && l00.querySelector(':scope > .nav-l00-btn span')].forEach(function(el){
      if(el && el.textContent.trim()) parts.push(el.textContent.trim());
    });
    return parts.filter(Boolean).join(' › ') || 'SUGO SOP';
  }
  function activePane(){ return document.querySelector('.content-pane.active'); }
  function activePaneId(){
    var pane = activePane();
    if(pane && pane.id) return pane.id.replace(/^pane-/, '');
    try{ return window.SUGO_ACTIVE_PANE || localStorage.getItem('sugo_last_pane') || ''; }catch(e){ return window.SUGO_ACTIVE_PANE || ''; }
  }
  function makePaneFavoriteItem(paneId){
    return '<button type="button" class="sugo-fr-item" data-sugo-fr-open="' + esc(paneId) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-favorite">F</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(getPaneTitle(paneId)) + '</span><span class="sugo-fr-path">' + esc(getPanePath(paneId)) + '</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-fr-remove="' + esc(paneId) + '" title="Remove favorite" aria-label="Remove favorite">×</span>' +
      '</button>';
  }
  function softRefreshQuickAccess(){
    try{ if(window.SUGOFavoritesRecent && typeof window.SUGOFavoritesRecent.refresh === 'function') window.SUGOFavoritesRecent.refresh(); }catch(e){}
    try{ if(window.SUGOFavoritesRemoveGuard && typeof window.SUGOFavoritesRemoveGuard.refresh === 'function') window.SUGOFavoritesRemoveGuard.refresh(); }catch(e){}

    var favBox = byId('sugoFavoritesList');
    if(favBox && !favBox.querySelector('.sugo-fr-item')){
      var paneFavorites = uniquePaneList(readFavorites()).slice(0, MAX_FAV_DISPLAY);
      if(paneFavorites.length){
        favBox.innerHTML = paneFavorites.map(makePaneFavoriteItem).join('');
      }else if(!favBox.querySelector('.sugo-fr-empty')){
        favBox.innerHTML = '<div class="sugo-fr-empty">No favorites yet. Open any macro and press Favorite.</div>';
      }
    }

    var favCount = byId('sugoFavCount');
    var recentCount = byId('sugoRecentCount');
    var recentBox = byId('sugoRecentList');
    if(favCount && favBox) favCount.textContent = String(favBox.querySelectorAll('.sugo-fr-item').length);
    if(recentCount && recentBox) recentCount.textContent = String(recentBox.querySelectorAll('.sugo-fr-item').length);
  }
  function setFavorite(paneId, enabled){
    paneId = String(paneId || '').trim();
    if(!paneExists(paneId)) return;
    var list = uniquePaneList(readFavorites());
    var idx = list.indexOf(paneId);
    if(enabled && idx < 0) list.unshift(paneId);
    if(!enabled && idx >= 0) list.splice(idx, 1);
    writeFavorites(list);
    softRefreshQuickAccess();
    paintAllFavoriteButtons();
  }
  function toggleFavorite(paneId){ setFavorite(paneId, !isFavorite(paneId)); }
  function paintButton(btn, paneId){
    var active = isFavorite(paneId);
    var state = active ? 'on' : 'off';
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.setAttribute('title', active ? 'Remove from Favorites' : 'Add to Favorites');
    if(btn.getAttribute('data-sugo-fav-state') !== state){
      btn.setAttribute('data-sugo-fav-state', state);
      btn.innerHTML = '<span class="sugo-visible-fav-star">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Favorite');
    }
  }
  function ensureToolbar(pane, paneId){
    var toolbar = pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'sugo-direct-edit-toolbar sugo-visible-fav-toolbar';
      var closeBtn = pane.querySelector(':scope > .close-pane-btn');
      if(closeBtn && closeBtn.nextSibling) pane.insertBefore(toolbar, closeBtn.nextSibling);
      else pane.insertBefore(toolbar, pane.firstChild);
    }
    toolbar.querySelectorAll('[data-sugo-visible-fav]').forEach(function(old){
      if(old.getAttribute('data-sugo-visible-fav') !== paneId) old.remove();
    });
    var btn = toolbar.querySelector('[data-sugo-visible-fav="' + cssEscape(paneId) + '"]');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sugo-direct-favorite-btn';
      btn.setAttribute('data-sugo-visible-fav', paneId);
      toolbar.appendChild(btn);
    }
    paintButton(btn, paneId);
  }
  function ensureCardBar(pane, paneId){
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
    var title = getPaneTitle(paneId);
    var path = getPanePath(paneId);
    var state = paneId + '|' + (active ? 'on' : 'off') + '|' + title + '|' + path;
    if(bar.getAttribute('data-sugo-card-state') === state) return;
    bar.setAttribute('data-sugo-card-state', state);
    bar.innerHTML = '<div class="sugo-fr-cardmeta"><div class="sugo-fr-cardtitle">' + esc(title) + '</div><div class="sugo-fr-cardpath">' + esc(path) + '</div></div>' +
      '<button type="button" class="sugo-fr-favbtn' + (active ? ' active' : '') + '" data-sugo-fav-toggle="' + esc(paneId) + '"><span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function syncActiveFavorite(){
    var pane = activePane();
    var paneId = activePaneId();
    if(!pane || !paneId || !paneExists(paneId)) return;
    ensureToolbar(pane, paneId);
    ensureCardBar(pane, paneId);
    softRefreshQuickAccess();
  }
  function paintAllFavoriteButtons(){
    document.querySelectorAll('[data-sugo-visible-fav]').forEach(function(btn){ paintButton(btn, btn.getAttribute('data-sugo-visible-fav')); });
    document.querySelectorAll('[data-sugo-fav-toggle]').forEach(function(btn){
      var paneId = btn.getAttribute('data-sugo-fav-toggle');
      var active = isFavorite(paneId);
      btn.classList.toggle('active', active);
      btn.innerHTML = '<span class="sugo-fr-badge">' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite');
    });
  }

  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest && event.target.closest('[data-sugo-visible-fav]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    toggleFavorite(btn.getAttribute('data-sugo-visible-fav'));
  }, true);

  var originalShowPane = window.showPane;
  if(typeof originalShowPane === 'function' && !originalShowPane.__sugoVisibleFavoriteWrapped){
    var wrapped = function(){
      var result = originalShowPane.apply(this, arguments);
      setTimeout(syncActiveFavorite, 0);
      setTimeout(syncActiveFavorite, 120);
      return result;
    };
    wrapped.__sugoVisibleFavoriteWrapped = true;
    window.showPane = wrapped;
    try{ showPane = window.showPane; }catch(e){}
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(syncActiveFavorite, 80); });
  else setTimeout(syncActiveFavorite, 80);
  window.addEventListener('load', function(){ setTimeout(syncActiveFavorite, 80); setTimeout(syncActiveFavorite, 600); });
  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('.nav-l000-btn,[data-sugo-fr-open]')){
      setTimeout(syncActiveFavorite, 80);
      setTimeout(syncActiveFavorite, 220);
    }
  }, true);
  try{ new MutationObserver(function(){ setTimeout(syncActiveFavorite, 60); }).observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] }); }catch(e){}
  setInterval(syncActiveFavorite, 1200);

  window.SUGOVisibleFavoriteButton = { sync: syncActiveFavorite, toggle: toggleFavorite, set: setFavorite, isFavorite: isFavorite };
})();
