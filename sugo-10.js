(function(){
  'use strict';

  if(window.__SUGO_FAVORITES_OPEN_HOTFIX_V2__) return;
  window.__SUGO_FAVORITES_OPEN_HOTFIX_V2__ = true;

  if(!window.CSS) window.CSS = {};
  if(typeof window.CSS.escape !== 'function'){
    window.CSS.escape = function(value){
      return String(value || '').replace(/[^a-zA-Z0-9_-]/g, function(ch){
        return '\\' + ch;
      });
    };
  }

  function byId(id){ return document.getElementById(id); }
  function normalizePaneId(value){
    value = String(value || '').trim();
    value = value.replace(/^pane-/, '');
    return value;
  }
  function paneExists(paneId){
    return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]);
  }
  function closeQuickAccessPanel(){
    var panel = byId('sugoFavRecentPanel');
    if(panel){
      panel.classList.remove('is-open');
      panel.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){ btn.setAttribute('aria-expanded', 'false'); });
    }
  }
  function activateNav(paneId){
    document.querySelectorAll('.nav-l000-btn').forEach(function(btn){
      btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId);
    });
    try{
      if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.syncToPane === 'function'){
        window.SugoApp.navigation.syncToPane(paneId, { persist:true });
      }
    }catch(e){}
  }
  function fallbackPreparePane(paneId){
    var existing = byId('pane-' + paneId);
    if(existing) return existing;
    if(typeof window.preparePaneElement === 'function'){
      try { return window.preparePaneElement(paneId); } catch(e){}
    }
    if(!paneExists(paneId)) return null;
    var contentArea = byId('contentArea');
    if(!contentArea) return null;
    var paneDiv = document.createElement('div');
    paneDiv.className = 'content-pane';
    paneDiv.dataset.lazy = '1';
    paneDiv.id = 'pane-' + paneId;
    var closeBtn = document.createElement('button');
    closeBtn.className = 'close-pane-btn';
    closeBtn.type = 'button';
    closeBtn.innerHTML = '✕';
    closeBtn.addEventListener('click', function(){
      document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
      var welcome = byId('welcomeMsg');
      if(welcome) welcome.style.display = 'flex';
      try { localStorage.removeItem('sugo_last_pane'); } catch(e){}
    });
    var container = document.createElement('div');
    var tmp = document.createElement('div');
    tmp.innerHTML = (window.paneContent[paneId] && (window.paneContent[paneId].en || window.paneContent[paneId].html)) || '';
    container.appendChild(tmp);
    paneDiv.appendChild(closeBtn);
    paneDiv.appendChild(container);
    contentArea.appendChild(paneDiv);
    return paneDiv;
  }
  function forceOpenPane(paneId){
    if(!paneExists(paneId)) return false;
    var pane = fallbackPreparePane(paneId);
    if(!pane) return false;
    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    pane.classList.add('active');
    window.SUGO_ACTIVE_PANE = paneId;
    window.SUGO_ACTIVE_PANE_TS = Date.now();
    try { localStorage.setItem('sugo_last_pane', paneId); } catch(e){}
    activateNav(paneId);
    try { pane.scrollIntoView({ block:'start', behavior:'auto' }); } catch(e){}
    return true;
  }
  function robustOpenPane(rawPaneId){
    var paneId = normalizePaneId(rawPaneId);
    if(!paneExists(paneId)) return false;

    var opened = false;
    try{
      if(typeof window.showPane === 'function'){
        window.showPane(paneId, true);
        opened = true;
      } else if(typeof showPane === 'function'){
        showPane(paneId, true);
        opened = true;
      }
    }catch(e){ opened = false; }

    setTimeout(function(){
      var pane = byId('pane-' + paneId);
      if(!pane || !pane.classList.contains('active')) forceOpenPane(paneId);
      closeQuickAccessPanel();
    }, 0);

    if(!opened) return forceOpenPane(paneId);
    return true;
  }
  function handleOpenClick(event){
    if(event.target.closest && event.target.closest('[data-sugo-fr-remove],[data-sugo-ai-fav-remove],[data-sugo-fav-toggle],[data-sugo-ai-fav-current]')) return;
    var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
    if(!open) return;
    var paneId = open.getAttribute('data-sugo-fr-open');
    if(!paneId) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    robustOpenPane(paneId);
  }
  function handleKeyboard(event){
    if(event.key !== 'Enter' && event.key !== ' ') return;
    if(event.target.closest && event.target.closest('[data-sugo-fr-remove],[data-sugo-ai-fav-remove],[data-sugo-fav-toggle],[data-sugo-ai-fav-current]')) return;
    var open = event.target.closest && event.target.closest('[data-sugo-fr-open]');
    if(!open) return;
    event.preventDefault();
    robustOpenPane(open.getAttribute('data-sugo-fr-open'));
  }
  function refreshAndRepairItems(){
    document.querySelectorAll('[data-sugo-fr-open]').forEach(function(item){
      if(!item.getAttribute('tabindex')) item.setAttribute('tabindex', '0');
      if(item.tagName !== 'BUTTON') item.setAttribute('role', 'button');
      item.style.pointerEvents = 'auto';
    });
  }
  document.addEventListener('click', handleOpenClick, true);
  document.addEventListener('keydown', handleKeyboard, true);
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(refreshAndRepairItems, 0); setTimeout(refreshAndRepairItems, 500); });
  window.addEventListener('load', function(){ setTimeout(refreshAndRepairItems, 0); setTimeout(refreshAndRepairItems, 800); });
  var panel = byId('sugoFavRecentPanel');
  if(panel && window.MutationObserver){
    new MutationObserver(refreshAndRepairItems).observe(panel, { childList:true, subtree:true });
  }
  window.SUGOFavoritesOpenHotfix = { version:'2.0.0', open: robustOpenPane, repair: refreshAndRepairItems };
})();
