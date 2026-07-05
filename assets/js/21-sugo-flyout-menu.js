/* =========================================================
   SUGO Flyout Menu Override v2.0 Stable
   - Replaces nested sidebar dropdowns with fixed flyout panels.
   - Opens topics through the original showPane path, with hard fallback.
   - Uses original DOM as source of truth; Worker/API/Admin unchanged.
   ========================================================= */
(function(){
  'use strict';

  var stage = null;
  var nav = null;
  var panelWidth = 292;
  var panelGap = 10;
  var bypass = false;
  var hoverTimer = null;

  function ready(fn){
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  function qs(sel, root){ return (root || document).querySelector(sel); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function directChildren(parent, selector){
    if(!parent) return [];
    return Array.prototype.filter.call(parent.children || [], function(child){
      return child && child.matches && child.matches(selector);
    });
  }
  function textOfButton(btn){
    if(!btn) return '';
    var span = btn.querySelector('span');
    return (span ? span.textContent : btn.textContent || '').replace(/\s+/g,' ').trim();
  }
  function cssEscape(value){
    if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value));
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }
  function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

  function ensureStage(){
    stage = qs('#sugoFlyoutStage');
    if(!stage){
      stage = document.createElement('div');
      stage.id = 'sugoFlyoutStage';
      stage.setAttribute('aria-live','polite');
      document.body.appendChild(stage);
    }
    return stage;
  }

  function unlockOriginalNav(){
    nav = qs('#sidebarNav');
    if(!nav) return;
    nav.classList.remove('sugo-cascade-mode');
    qsa('.nav-lroot', nav).forEach(function(root){
      root.classList.remove('sugo-root-hidden');
      root.classList.remove('sugo-cascade-active-root');
    });
    var librarySelect = qs('#sugoLibrarySelect');
    if(librarySelect && librarySelect.value){
      try{ librarySelect.value = ''; }catch(e){}
    }
  }

  function setEnabled(){
    document.body.classList.add('sugo-flyout-enabled');
    unlockOriginalNav();
  }

  function clearCurrentVisual(){
    qsa('.sugo-flyout-current').forEach(function(el){ el.classList.remove('sugo-flyout-current'); });
    qsa('.nav-lroot-chev.open,.nav-l0-chev.open,.nav-l00-chev.open').forEach(function(el){ el.classList.remove('open'); });
  }

  function markOriginal(btn){
    if(!btn) return;
    btn.classList.add('sugo-flyout-current');
    var chev = btn.querySelector('.nav-lroot-chev,.nav-l0-chev,.nav-l00-chev');
    if(chev) chev.classList.add('open');
  }

  function safeShowWelcome(){
    try{
      if(typeof window.showOnlyWelcome === 'function') window.showOnlyWelcome();
      else if(typeof showOnlyWelcome === 'function') showOnlyWelcome();
    }catch(e){}
  }

  function closePanelsFrom(level){
    ensureStage();
    qsa('.sugo-flyout-panel', stage).forEach(function(panel){
      var n = Number(panel.getAttribute('data-level') || 0);
      if(n >= level) panel.remove();
    });
    if(!qs('.sugo-flyout-panel', stage)){
      stage.classList.remove('sugo-flyout-open');
    }
  }

  function closeAll(){
    if(hoverTimer) window.clearTimeout(hoverTimer);
    ensureStage().innerHTML = '';
    stage.classList.remove('sugo-flyout-open');
    clearCurrentVisual();
  }

  function positionPanel(panel, level, anchor){
    var sidebar = qs('#sidebar');
    var sidebarRect = sidebar ? sidebar.getBoundingClientRect() : { right: 0 };
    var anchorRect = anchor && anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { top: 84 };
    var width = panelWidth;
    var left;

    if(window.innerWidth <= 900){
      left = 12;
      width = Math.max(260, window.innerWidth - 24);
    }else{
      var baseLeft = Math.max(12, sidebarRect.right + panelGap);
      left = baseLeft + ((level - 1) * (panelWidth + panelGap));
      var maxLeft = window.innerWidth - panelWidth - 14;
      if(left > maxLeft){
        left = Math.max(baseLeft, maxLeft);
      }
    }

    var top = clamp(anchorRect.top - 4, 72, Math.max(74, window.innerHeight - 190));
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.width = width + 'px';
    panel.style.maxHeight = 'calc(100vh - ' + Math.max(22, top + 16) + 'px)';
  }

  function makePanel(level, title, kicker, anchor){
    ensureStage();
    closePanelsFrom(level);
    var panel = document.createElement('div');
    panel.className = 'sugo-flyout-panel';
    panel.setAttribute('data-level', String(level));
    panel.setAttribute('role','menu');
    panel.innerHTML = '' +
      '<div class="sugo-flyout-head">' +
        '<div class="sugo-flyout-kicker"></div>' +
        '<div class="sugo-flyout-title"></div>' +
        '<button class="sugo-flyout-close" type="button" aria-label="Close">×</button>' +
      '</div>' +
      '<div class="sugo-flyout-list"></div>';
    qs('.sugo-flyout-kicker', panel).textContent = kicker || '';
    qs('.sugo-flyout-title', panel).textContent = title || 'Menu';
    qs('.sugo-flyout-close', panel).addEventListener('click', function(e){
      e.preventDefault(); e.stopPropagation();
      closePanelsFrom(level);
      if(level === 1) closeAll();
    });
    stage.appendChild(panel);
    stage.classList.add('sugo-flyout-open');
    positionPanel(panel, level, anchor);
    return panel;
  }

  function renderEmpty(list){
    var empty = document.createElement('div');
    empty.className = 'sugo-flyout-empty';
    empty.textContent = 'No items in this level';
    list.appendChild(empty);
  }

  function renderError(list, message){
    var err = document.createElement('div');
    err.className = 'sugo-flyout-error';
    err.textContent = message || 'Could not open this item.';
    list.appendChild(err);
  }

  function buildFlyoutButton(label, type, hasChildren, original){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'sugo-flyout-item' + (type === 'topic' ? ' sugo-flyout-topic' : '');
    b.setAttribute('data-flyout-type', type);
    b.innerHTML = '<span class="sugo-flyout-dot"></span><span class="sugo-flyout-label"></span><span class="sugo-flyout-arrow">' + (hasChildren ? '›' : '') + '</span>';
    qs('.sugo-flyout-label', b).textContent = label || 'Untitled';
    b._sugoOriginal = original;
    return b;
  }

  function renderRoot(root, anchor){
    if(!root) return;
    safeShowWelcome();
    clearCurrentVisual();
    var rootBtn = qs(':scope > .nav-lroot-btn', root) || qs('.nav-lroot-btn', root);
    markOriginal(rootBtn);
    var title = textOfButton(rootBtn) || 'Menu';
    var rootChildren = qs(':scope > .nav-lroot-children', root) || qs('.nav-lroot-children', root);
    var categories = directChildren(rootChildren, '.nav-l0');
    var panel = makePanel(1, title, 'MENU', anchor || rootBtn);
    var list = qs('.sugo-flyout-list', panel);
    if(!categories.length) renderEmpty(list);
    categories.forEach(function(cat){
      var catBtn = qs(':scope > .nav-l0-btn', cat) || qs('.nav-l0-btn', cat);
      var child = qs(':scope > .nav-l0-children', cat) || qs('.nav-l0-children', cat);
      var btn = buildFlyoutButton(textOfButton(catBtn), 'category', directChildren(child, '.nav-l00').length > 0, cat);
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); renderCategory(cat, btn); });
      btn.addEventListener('mouseenter', function(){
        if(window.innerWidth <= 900) return;
        if(hoverTimer) window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(function(){ renderCategory(cat, btn); }, 120);
      });
      list.appendChild(btn);
    });
  }

  function renderCategory(cat, anchor){
    if(!cat) return;
    safeShowWelcome();
    qsa('.nav-l0-btn.sugo-flyout-current,.nav-l00-btn.sugo-flyout-current,.sugo-flyout-item.sugo-flyout-current').forEach(function(el){ el.classList.remove('sugo-flyout-current'); });
    var catBtn = qs(':scope > .nav-l0-btn', cat) || qs('.nav-l0-btn', cat);
    markOriginal(catBtn);
    if(anchor) anchor.classList.add('sugo-flyout-current');
    var child = qs(':scope > .nav-l0-children', cat) || qs('.nav-l0-children', cat);
    var sections = directChildren(child, '.nav-l00');
    var panel = makePanel(2, textOfButton(catBtn) || 'Category', 'CAT', anchor || catBtn);
    var list = qs('.sugo-flyout-list', panel);
    if(!sections.length) renderEmpty(list);
    sections.forEach(function(sec){
      var secBtn = qs(':scope > .nav-l00-btn', sec) || qs('.nav-l00-btn', sec);
      var secChild = qs(':scope > .nav-l00-children', sec) || qs('.nav-l00-children', sec);
      var btn = buildFlyoutButton(textOfButton(secBtn), 'section', directChildren(secChild, '.nav-l000-btn').length > 0, sec);
      btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); renderSection(sec, btn); });
      btn.addEventListener('mouseenter', function(){
        if(window.innerWidth <= 900) return;
        if(hoverTimer) window.clearTimeout(hoverTimer);
        hoverTimer = window.setTimeout(function(){ renderSection(sec, btn); }, 120);
      });
      list.appendChild(btn);
    });
  }

  function renderSection(sec, anchor){
    if(!sec) return;
    safeShowWelcome();
    qsa('.nav-l00-btn.sugo-flyout-current,.sugo-flyout-panel[data-level="2"] .sugo-flyout-item.sugo-flyout-current,.sugo-flyout-panel[data-level="3"] .sugo-flyout-item.sugo-flyout-current').forEach(function(el){ el.classList.remove('sugo-flyout-current'); });
    var secBtn = qs(':scope > .nav-l00-btn', sec) || qs('.nav-l00-btn', sec);
    markOriginal(secBtn);
    if(anchor) anchor.classList.add('sugo-flyout-current');
    var child = qs(':scope > .nav-l00-children', sec) || qs('.nav-l00-children', sec);
    var topics = directChildren(child, '.nav-l000-btn');
    var panel = makePanel(3, textOfButton(secBtn) || 'Section', 'TOPICS', anchor || secBtn);
    var list = qs('.sugo-flyout-list', panel);
    if(!topics.length) renderEmpty(list);
    topics.forEach(function(topicBtn){
      var paneId = topicBtn.getAttribute('data-pane') || '';
      var btn = buildFlyoutButton((topicBtn.textContent || '').replace(/\s+/g,' ').trim(), 'topic', false, topicBtn);
      if(paneId) btn.setAttribute('data-pane', paneId);
      btn.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var ok = openTopic(topicBtn, btn);
        if(!ok){
          var listNode = btn.closest('.sugo-flyout-list');
          if(listNode && !listNode.querySelector('.sugo-flyout-error')) renderError(listNode, 'Topic did not open. Missing pane id: ' + (paneId || 'none'));
        }
      });
      list.appendChild(btn);
    });
  }

  function isPaneActive(paneId){
    var pane = document.getElementById(paneId);
    return Boolean(pane && pane.classList.contains('active'));
  }

  function getPaneElement(paneId){
    if(!paneId) return null;
    var pane = document.getElementById(paneId);
    if(pane) return pane;

    try{
      if(typeof window.preparePaneElement === 'function') pane = window.preparePaneElement(paneId);
    }catch(e){}
    if(pane) return pane;

    try{
      if(typeof preparePaneElement === 'function') pane = preparePaneElement(paneId);
    }catch(e){}
    if(pane) return pane;

    try{ pane = qs('.content-pane[data-pane="' + cssEscape(paneId) + '"]'); }catch(e){}
    return pane || document.getElementById(paneId);
  }

  function forceOpenPane(paneId){
    var pane = getPaneElement(paneId);
    if(!pane) return false;

    try{ if(typeof window.closeAIPane === 'function') window.closeAIPane(); }catch(e){}
    qsa('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome = qs('#welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    pane.classList.add('active');

    qsa('.nav-l000-btn').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-pane') === paneId); });
    try{ localStorage.setItem('sugo_last_pane', paneId); }catch(e){}
    window.SUGO_ACTIVE_PANE = paneId;
    window.SUGO_ACTIVE_PANE_TS = Date.now();

    try{
      if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.syncToPane === 'function'){
        window.SugoApp.navigation.syncToPane(paneId, { persist:true });
      }
    }catch(e){}

    return isPaneActive(paneId) || Boolean(pane.classList.contains('active'));
  }

  function callOriginalOpeners(topicBtn, paneId){
    var ok = false;

    try{
      if(paneId && typeof window.showPane === 'function'){
        window.showPane(paneId, true);
        ok = isPaneActive(paneId);
      }
    }catch(e){ ok = false; }

    if(!ok){
      try{
        if(paneId && typeof showPane === 'function'){
          showPane(paneId, true);
          ok = isPaneActive(paneId);
        }
      }catch(e){ ok = false; }
    }

    if(!ok && topicBtn){
      try{
        bypass = true;
        topicBtn.dispatchEvent(new MouseEvent('click', { bubbles:true, cancelable:true, view:window }));
        ok = isPaneActive(paneId);
      }catch(e){ ok = false; }
      finally{ bypass = false; }
    }

    return ok;
  }

  function openTopic(topicBtn, flyoutBtn){
    if(!topicBtn) return false;
    var paneId = topicBtn.getAttribute('data-pane') || (flyoutBtn && flyoutBtn.getAttribute('data-pane')) || '';
    if(!paneId) return false;

    qsa('.sugo-flyout-item.sugo-flyout-current,.sugo-flyout-topic.sugo-flyout-opened').forEach(function(el){
      el.classList.remove('sugo-flyout-current');
      el.classList.remove('sugo-flyout-opened');
    });
    if(flyoutBtn){
      flyoutBtn.classList.add('sugo-flyout-current');
      flyoutBtn.classList.add('sugo-flyout-opened');
    }

    var opened = callOriginalOpeners(topicBtn, paneId);
    if(!opened) opened = forceOpenPane(paneId);

    // One more safety retry after all older click handlers finish.
    window.setTimeout(function(){
      if(!isPaneActive(paneId)) forceOpenPane(paneId);
    }, 80);

    if(opened){
      closeAll();
    }else{
      try{ console.warn('[SUGO Flyout] Could not open topic pane:', paneId); }catch(e){}
    }
    return opened;
  }

  function handleOriginalNavClick(event){
    if(bypass || !document.body.classList.contains('sugo-flyout-enabled')) return;
    nav = qs('#sidebarNav');
    if(!nav) return;
    var target = event.target;
    var btn = target && target.closest ? target.closest('.nav-lroot-btn,.nav-l0-btn,.nav-l00-btn,.nav-l000-btn') : null;
    if(!btn || !nav.contains(btn)) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();

    if(btn.classList.contains('nav-lroot-btn')){
      renderRoot(btn.closest('.nav-lroot'), btn);
      return;
    }
    if(btn.classList.contains('nav-l0-btn')){
      var root = btn.closest('.nav-lroot');
      var existingRootPanel = qs('.sugo-flyout-panel[data-level="1"]', stage || document);
      if(!existingRootPanel) renderRoot(root, qs(':scope > .nav-lroot-btn', root) || btn);
      renderCategory(btn.closest('.nav-l0'), btn);
      return;
    }
    if(btn.classList.contains('nav-l00-btn')){
      var cat = btn.closest('.nav-l0');
      if(cat && !qs('.sugo-flyout-panel[data-level="2"]', stage || document)) renderCategory(cat, qs(':scope > .nav-l0-btn', cat) || btn);
      renderSection(btn.closest('.nav-l00'), btn);
      return;
    }
    if(btn.classList.contains('nav-l000-btn')){
      openTopic(btn, null);
    }
  }

  function installGuards(){
    document.addEventListener('click', handleOriginalNavClick, true);

    // Close only when clicking outside sidebar/flyout/admin popover.
    document.addEventListener('click', function(e){
      if(!stage || !stage.classList.contains('sugo-flyout-open')) return;
      if(stage.contains(e.target)) return;
      if(nav && nav.contains(e.target)) return;
      var adminPopover = qs('#sugoTinyAdminPopover');
      if(adminPopover && adminPopover.contains(e.target)) return;
      closeAll();
    }, true);

    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeAll(); });
    window.addEventListener('resize', closeAll);
  }

  function refreshAfterDynamicMenuChanges(){
    unlockOriginalNav();
    closeAll();
  }

  ready(function(){
    ensureStage();
    setEnabled();
    installGuards();

    // Older scripts can re-enable cascade mode after async work; keep source roots visible.
    var runs = 0;
    var interval = window.setInterval(function(){
      setEnabled();
      runs += 1;
      if(runs >= 40) window.clearInterval(interval);
    }, 250);

    var observedNav = qs('#sidebarNav');
    if(observedNav && window.MutationObserver){
      var mo = new MutationObserver(function(mutations){
        var hasStructuralChange = mutations.some(function(m){
          return m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length);
        });
        if(!hasStructuralChange) return;
        window.clearTimeout(refreshAfterDynamicMenuChanges._t);
        refreshAfterDynamicMenuChanges._t = window.setTimeout(refreshAfterDynamicMenuChanges, 180);
      });
      mo.observe(observedNav, { childList:true, subtree:true });
    }
  });
})();
