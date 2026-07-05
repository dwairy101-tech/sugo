// Extracted from index(94).html: <script id="sugo-ai-ticket-favorites-and-quick-access-js">
(function(){
  'use strict';
  var AI_FAV_KEY = 'sugo_favorite_ai_tickets_v1';
  var MAX_AI_FAV = 12;
  var observerStarted = false;

  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]; }); }
  function parseList(){ try{ var v = JSON.parse(localStorage.getItem(AI_FAV_KEY) || '[]'); return Array.isArray(v) ? v : []; }catch(e){ return []; } }
  function saveList(list){ try{ localStorage.setItem(AI_FAV_KEY, JSON.stringify((list || []).slice(0, MAX_AI_FAV))); }catch(e){} }
  function plainFromHtml(html){ var d = document.createElement('div'); d.innerHTML = html || ''; return (d.innerText || d.textContent || '').trim(); }
  function hash(str){ var h = 2166136261; str = String(str || ''); for(var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); } return (h >>> 0).toString(36); }
  function compactTitle(q){ q = String(q || '').replace(/\s+/g,' ').trim(); return q ? (q.length > 58 ? q.slice(0,58) + '…' : q) : 'Generated Ticket'; }
  function isTicketView(){ var b = byId('aiBadgeLabel'); return !!(b && /ticket/i.test(b.textContent || '')); }
  function currentTicketPayload(){
    var body = byId('aiAnswerBody');
    if(!body || !isTicketView()) return null;
    if(body.querySelector('.ai-answer-loading,.ai-spinner,.ai-cursor')) return null;
    var text = (typeof window.sugoHtmlToPlainText === 'function') ? window.sugoHtmlToPlainText(body) : (body.innerText || '');
    text = String(text || '').trim();
    if(text.length < 20 || /AI could not generate|Searching the knowledge/i.test(text)) return null;
    var query = (byId('aiAnswerQuery') && byId('aiAnswerQuery').textContent || '').trim();
    var html = body.innerHTML;
    var id = 'ai-ticket-' + hash(query + '\n' + text.slice(0,900));
    return { id:id, title:compactTitle(query), query:query, html:html, text:text, ts:Date.now() };
  }
  function isAiFavorite(id){ return parseList().some(function(item){ return item && item.id === id; }); }
  function setAiFavorite(payload, enabled){
    if(!payload || !payload.id) return;
    var list = parseList().filter(function(item){ return item && item.id !== payload.id; });
    if(enabled) list.unshift(payload);
    saveList(list);
    ensureAiFavoriteBar();
    refreshAll();
  }
  function ensureAiFavoriteBar(){
    var card = document.querySelector('.ai-answer-card');
    var header = document.querySelector('.ai-answer-header');
    if(!card || !header) return;
    var old = card.querySelector(':scope > .sugo-ai-favbar');
    var payload = currentTicketPayload();
    if(!payload){ if(old) old.remove(); return; }
    var active = isAiFavorite(payload.id);
    if(!old){
      old = document.createElement('div');
      old.className = 'sugo-ai-favbar';
      header.insertAdjacentElement('afterend', old);
    }
    old.setAttribute('data-ai-ticket-id', payload.id);
    old.innerHTML = '<div class="sugo-ai-favmeta"><div class="sugo-ai-favtitle">Generated Ticket</div><div class="sugo-ai-favpath">' + esc(payload.title) + '</div></div>' +
      '<button type="button" class="sugo-ai-favbtn' + (active ? ' active' : '') + '" data-sugo-ai-fav-current="1"><span>' + (active ? '★' : '☆') + '</span>' + (active ? 'Favorited' : 'Add Favorite') + '</button>';
  }
  function makeAiItem(item){
    return '<button type="button" class="sugo-fr-item sugo-fr-ai-item" data-sugo-ai-fav-open="' + esc(item.id) + '">' +
      '<span class="sugo-fr-icon sugo-fr-icon-ai">AI</span>' +
      '<span class="sugo-fr-main"><span class="sugo-fr-name">' + esc(item.title || 'Generated Ticket') + '</span><span class="sugo-fr-path">AI Generated Ticket</span></span>' +
      '<span class="sugo-fr-remove" role="button" tabindex="0" data-sugo-ai-fav-remove="' + esc(item.id) + '" title="Remove favorite">×</span>' +
      '</button>';
  }
  function renderAiFavorites(){
    var box = byId('sugoFavoritesList');
    if(!box) return;
    box.querySelectorAll('.sugo-fr-ai-label,.sugo-fr-ai-item').forEach(function(el){ el.remove(); });
    var list = parseList();
    if(!list.length){ updateCounts(); return; }
    var empty = box.querySelector('.sugo-fr-empty');
    if(empty && /No favorites/i.test(empty.textContent || '')) empty.remove();
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="sugo-fr-ai-label">Generated Tickets</div>' + list.map(makeAiItem).join('');
    Array.from(wrap.children).reverse().forEach(function(node){ box.insertBefore(node, box.firstChild); });
    updateCounts();
  }
  function openAiFavorite(id){
    var item = parseList().find(function(x){ return x && x.id === id; });
    if(!item) return;
    if(typeof window.clearAllContentAndWelcome === 'function') window.clearAllContentAndWelcome();
    var welcome = byId('welcomeMsg'); if(welcome) welcome.style.display = 'none';
    var pane = byId('aiAnswerPane'); if(pane) pane.classList.add('active');
    var badge = byId('aiBadgeLabel'); if(badge) badge.textContent = '✦ Saved Ticket';
    var query = byId('aiAnswerQuery'); if(query) query.textContent = item.query || item.title || 'Saved ticket';
    var body = byId('aiAnswerBody'); if(body){ body.innerHTML = item.html || esc(item.text || ''); body.setAttribute('dir', /[\u0600-\u06FF]/.test(item.text || '') ? 'rtl' : 'ltr'); }
    var sources = byId('aiSources'); if(sources){ sources.classList.remove('has-items'); sources.innerHTML = ''; }
    var follow = byId('aiFollowupRow'); if(follow) follow.classList.remove('active');
    setTimeout(ensureAiFavoriteBar, 30);
  }
  function removeAiFavorite(id){
    saveList(parseList().filter(function(x){ return x && x.id !== id; }));
    ensureAiFavoriteBar();
    refreshAll();
  }
  function setActiveTab(tab, shouldOpen){
    tab = tab === 'recent' ? 'recent' : 'favorites';
    var panel = byId('sugoFavRecentPanel');
    document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){
      var active = btn.getAttribute('data-sugo-fr-tab') === tab;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('aria-expanded', (panel && panel.classList.contains('is-open') && active) ? 'true' : 'false');
    });
    document.querySelectorAll('[data-sugo-fr-section]').forEach(function(sec){
      sec.classList.toggle('active', sec.getAttribute('data-sugo-fr-section') === tab);
    });
    if(panel){
      if(shouldOpen === true) panel.classList.add('is-open');
      if(shouldOpen === false) panel.classList.remove('is-open');
      document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){
        var active = btn.getAttribute('data-sugo-fr-tab') === tab;
        btn.setAttribute('aria-expanded', (panel.classList.contains('is-open') && active) ? 'true' : 'false');
      });
    }
    try{ localStorage.setItem('sugo_quick_access_tab_v1', tab); }catch(e){}
  }
  function closeQuickAccess(){
    var panel = byId('sugoFavRecentPanel');
    if(!panel) return;
    panel.classList.remove('is-open');
    document.querySelectorAll('[data-sugo-fr-tab]').forEach(function(btn){ btn.setAttribute('aria-expanded', 'false'); });
  }
  function updateCounts(){
    var favBox = byId('sugoFavoritesList'), recentBox = byId('sugoRecentList');
    var favCount = parseList().length;
    if(favBox) favCount += favBox.querySelectorAll('.sugo-fr-item:not(.sugo-fr-ai-item)').length;
    var recentCount = recentBox ? recentBox.querySelectorAll('.sugo-fr-item').length : 0;
    var f = byId('sugoFavCount'); if(f) f.textContent = favCount;
    var r = byId('sugoRecentCount'); if(r) r.textContent = recentCount;
  }
  function refreshAll(){
    if(window.SUGOFavoritesRecent && typeof window.SUGOFavoritesRecent.refresh === 'function' && !window.SUGOFavoritesRecent.__aiPatchRunning){
      window.SUGOFavoritesRecent.__aiPatchRunning = true;
      try{ window.SUGOFavoritesRecent.refresh(); }catch(e){}
      window.SUGOFavoritesRecent.__aiPatchRunning = false;
    }
    renderAiFavorites();
    updateCounts();
  }
  function patchFavoritesRefresh(){
    if(!window.SUGOFavoritesRecent || typeof window.SUGOFavoritesRecent.refresh !== 'function' || window.SUGOFavoritesRecent.__aiTicketPatch) return;
    var original = window.SUGOFavoritesRecent.refresh;
    window.SUGOFavoritesRecent.refresh = function(){
      var result = original.apply(this, arguments);
      setTimeout(function(){ renderAiFavorites(); updateCounts(); }, 0);
      return result;
    };
    window.SUGOFavoritesRecent.__aiTicketPatch = true;
  }
  function installEvents(){
    document.addEventListener('click', function(event){
      var tab = event.target.closest && event.target.closest('[data-sugo-fr-tab]');
      if(tab){
        event.preventDefault();
        var panel = byId('sugoFavRecentPanel');
        var isSame = tab.classList.contains('active');
        var isOpen = !!(panel && panel.classList.contains('is-open'));
        if(isSame && isOpen){ closeQuickAccess(); return; }
        setActiveTab(tab.getAttribute('data-sugo-fr-tab'), true);
        return;
      }
      var cur = event.target.closest && event.target.closest('[data-sugo-ai-fav-current]');
      if(cur){ var payload = currentTicketPayload(); if(payload) setAiFavorite(payload, !isAiFavorite(payload.id)); return; }
      var rem = event.target.closest && event.target.closest('[data-sugo-ai-fav-remove]');
      if(rem){ event.preventDefault(); event.stopPropagation(); removeAiFavorite(rem.getAttribute('data-sugo-ai-fav-remove')); return; }
      var open = event.target.closest && event.target.closest('[data-sugo-ai-fav-open]');
      if(open){ event.preventDefault(); event.stopPropagation(); openAiFavorite(open.getAttribute('data-sugo-ai-fav-open')); return; }
    }, true);
    document.addEventListener('click', function(event){
      var panel = byId('sugoFavRecentPanel');
      if(panel && panel.classList.contains('is-open') && !event.target.closest('#sugoFavRecentPanel')) closeQuickAccess();
    });
  }
  function observeAiAnswer(){
    if(observerStarted) return;
    var body = byId('aiAnswerBody');
    var pane = byId('aiAnswerPane');
    if(!body || !pane) return;
    var mo = new MutationObserver(function(){ setTimeout(ensureAiFavoriteBar, 70); });
    mo.observe(body, { childList:true, subtree:true, characterData:true });
    var mo2 = new MutationObserver(function(){ setTimeout(ensureAiFavoriteBar, 70); });
    mo2.observe(pane, { attributes:true, attributeFilter:['class'] });
    observerStarted = true;
  }
  function boot(){
    patchFavoritesRefresh();
    installEvents();
    observeAiAnswer();
    var savedTab = 'favorites'; try{ savedTab = localStorage.getItem('sugo_quick_access_tab_v1') || 'favorites'; }catch(e){}
    setActiveTab(savedTab, false);
    setTimeout(refreshAll, 100);
    setTimeout(function(){ patchFavoritesRefresh(); refreshAll(); ensureAiFavoriteBar(); }, 500);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ patchFavoritesRefresh(); refreshAll(); observeAiAnswer(); ensureAiFavoriteBar(); });
})();
