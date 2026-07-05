// Extracted from index(94).html: <script id="sugo-typing-lag-hotfix-v5">
(function(){
  'use strict';

  var VERSION = '5.0.0-fast-live-search';
  var debounceTimer = null;
  var pendingFrame = null;
  var lastAppliedQuery = null;
  var navIndex = null;
  var liveWaitMs = 360;
  var isComposing = false;

  function byId(id){ return document.getElementById(id); }
  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }
  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآٱا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/گ/g, 'ك')
      .replace(/پ/g, 'ب')
      .replace(/چ/g, 'ج')
      .replace(/ڤ/g, 'ف')
      .replace(/ـ/g, '')
      .replace(/\bpass\s*word\b/g, 'password')
      .replace(/\bsign\s*in\b/g, 'login')
      .replace(/\blog\s*in\b/g, 'login')
      .replace(/\bphone\s*number\b/g, 'phone')
      .replace(/\bmobile\s*number\b/g, 'phone')
      .replace(/\buser\s*id\b/g, 'id')
      .replace(/\baccount\s*id\b/g, 'id')
      .replace(/\bsub\s*agency\b/g, 'subagency')
      .replace(/\bmain\s*agency\b/g, 'mainagency')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  function stripArabicArticle(token){
    token = String(token || '');
    return token.length > 4 && token.indexOf('ال') === 0 ? token.slice(2) : token;
  }
  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي').split(/\s+/).filter(Boolean));

  function getGroups(){
    return (window.SUGO_PRECISION_SEARCH && window.SUGO_PRECISION_SEARCH.groups) || {
      password:['password','باسورد','باسوورد','كلمة السر','كلمة السر','كلمة مرور','reset password'],
      phone:['phone','mobile','رقم الهاتف','هاتف','موبايل','ربط رقم','تغيير رقم'],
      sms:['sms','otp','code','كود','رمز التحقق'],
      ban:['ban','banned','blocked','حظر','محظور','باند','تقييد'],
      unban:['unban','appeal','فك حظر','رفع الحظر','استئناف'],
      recharge:['recharge','payment','coins','invoice','شحن','دفع','كوين','فاتورة'],
      withdrawal:['withdrawal','salary','diamonds','سحب','راتب','ماسات'],
      agency:['agency','agent','host','وكالة','وكاله','مضيف','مضيفه'],
      report:['report','abuse','complaint','بلاغ','ابلاغ','اساءة','إساءة'],
      location:['location','country','distance','موقع','دولة','دوله','مسافة'],
      game:['game','games','لعبة','لعبه','العاب'],
      crash:['crash','bug','freeze','كراش','تعطل','يعلق']
    };
  }
  function phraseVariants(value){
    var n = norm(value);
    if(!n) return [];
    var out = new Set([n]);
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripArabicArticle(t)); });
    return Array.from(out).filter(Boolean);
  }
  function tokens(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripArabicArticle).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }
  function hasPhrase(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    return phrase.length <= 3 ? (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0 : hay.indexOf(phrase) >= 0;
  }
  function expandLiteQuery(query){
    var q = norm(query);
    var original = tokens(query, false);
    var expanded = new Set(original);
    var groups = [];
    var groupMap = getGroups();
    Object.keys(groupMap).forEach(function(g){
      var terms = [];
      (groupMap[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      var matched = terms.some(function(term){ return hasPhrase(q, term); });
      if(matched){
        groups.push(g);
        expanded.add(g);
        terms.forEach(function(term){ tokens(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); });
      }
    });
    return { raw:q, original:original, expanded:Array.from(expanded), groups:groups };
  }
  function directLabel(node, selector){
    try{
      var span = node && node.querySelector(':scope > ' + selector + ' span');
      return span ? (span.textContent || '').replace(/\s+/g, ' ').trim() : '';
    }catch(e){ return ''; }
  }
  function buildNavIndex(){
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn[data-pane]'));
    navIndex = buttons.map(function(btn){
      var id = btn.getAttribute('data-pane') || '';
      var l00 = btn.closest('.nav-l00');
      var l0 = btn.closest('.nav-l0');
      var root = btn.closest('.nav-lroot');
      var title = (btn.textContent || '').replace(/\s+/g, ' ').trim() || id.replace(/-/g, ' ');
      var section = directLabel(l00, '.nav-l00-btn');
      var category = directLabel(l0, '.nav-l0-btn');
      var library = directLabel(root, '.nav-lroot-btn');
      var path = [library, category, section].filter(Boolean).join(' › ');
      var titleNorm = norm([id.replace(/-/g, ' '), title].join(' '));
      var pathNorm = norm(path);
      var searchNorm = norm([id.replace(/-/g, ' '), title, section, category, library].join(' '));
      return { id:id, btn:btn, l00:l00, l0:l0, root:root, title:title, section:section, category:category, library:library, path:path, titleNorm:titleNorm, pathNorm:pathNorm, searchNorm:searchNorm };
    });
    return navIndex;
  }
  function getNavIndex(){ return navIndex || buildNavIndex(); }
  function scoreLite(item, info){
    var score = 0;
    var hits = [];
    var q = info.raw;
    if(q && q.length >= 3){
      if(hasPhrase(item.titleNorm, q)){ score += 90; hits.push(q); }
      else if(hasPhrase(item.pathNorm, q)){ score += 48; hits.push(q); }
      else if(hasPhrase(item.searchNorm, q)){ score += 24; hits.push(q); }
    }
    info.groups.forEach(function(g){
      var groupMap = getGroups();
      var terms = [];
      (groupMap[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      var titleHit = terms.some(function(term){ return hasPhrase(item.titleNorm, term); });
      var pathHit = terms.some(function(term){ return hasPhrase(item.pathNorm, term); });
      var anyHit = terms.some(function(term){ return hasPhrase(item.searchNorm, term); });
      if(titleHit){ score += 42; hits.push(g); }
      else if(pathHit){ score += 28; hits.push(g); }
      else if(anyHit){ score += 16; hits.push(g); }
    });
    info.expanded.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(hasPhrase(item.titleNorm, w)){ score += 18; hits.push(w); }
      else if(item.titleNorm.indexOf(w) >= 0){ score += 11; hits.push(w); }
      if(hasPhrase(item.pathNorm, w)){ score += 9; hits.push(w); }
      else if(item.pathNorm.indexOf(w) >= 0){ score += 5; hits.push(w); }
      if(hasPhrase(item.searchNorm, w)){ score += 4; hits.push(w); }
    });
    var coverage = info.original.length ? info.original.filter(function(t){ return hasPhrase(item.searchNorm, t); }).length / info.original.length : 0;
    if(coverage >= 0.8) score += 14;
    else if(coverage >= 0.5) score += 8;
    if(/optimized|overview|placeholder/.test(item.id)) score -= 4;
    return Object.assign({}, item, { score:Math.max(0, score), hits:Array.from(new Set(hits)).slice(0, 6), coverage:Math.round(coverage * 100) / 100 });
  }
  function rankLite(query){
    var info = expandLiteQuery(query);
    return getNavIndex().map(function(item){ return scoreLite(item, info); })
      .filter(function(item){ return item.score > 0; })
      .sort(function(a,b){
        if(b.score !== a.score) return b.score - a.score;
        return String(a.title || '').localeCompare(String(b.title || ''));
      });
  }
  function setHidden(el, hidden){
    if(!el) return;
    if(hidden && !el.classList.contains('hidden-search')) el.classList.add('hidden-search');
    else if(!hidden && el.classList.contains('hidden-search')) el.classList.remove('hidden-search');
  }
  function setOpen(el, open){
    if(!el) return;
    if(open && !el.classList.contains('open')) el.classList.add('open');
    else if(!open && el.classList.contains('open')) el.classList.remove('open');
  }
  function clearLiveSearch(){
    var index = getNavIndex();
    index.forEach(function(item){ setHidden(item.btn, false); });
    document.querySelectorAll('.nav-l00,.nav-l0,.nav-lroot').forEach(function(el){ setHidden(el, false); });
    var nr = byId('noResults');
    if(nr) nr.style.display = 'none';
    var panel = byId('v51BestMatchPanel');
    if(panel){ panel.style.display = 'none'; panel.innerHTML = ''; }
  }
  function confidenceFor(best, second){
    if(!best) return { label:'Low', className:'ai-source-low', score:0 };
    var gap = second ? best.score - second.score : best.score;
    var high = best.score >= 80 && gap >= Math.max(8, best.score * 0.12);
    var medium = best.score >= 34;
    var label = high ? 'High' : medium ? 'Medium' : 'Low';
    return { label:label, className: high ? 'ai-source-high' : medium ? 'ai-source-medium' : 'ai-source-low', score:Math.round(best.score * 10) / 10 };
  }
  function renderBest(results){
    var panel = byId('v51BestMatchPanel');
    if(!panel) return;
    if(!results.length){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var conf = confidenceFor(results[0], results[1]);
    var rows = results.slice(0, 3).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i + 1) + '. ' + (t.title || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + (Math.round((t.score || 0) * 10) / 10) + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,4).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-precision-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-precision-ask="' + esc(t.title || t.id) + '" data-sugo-precision-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    var ambiguous = results[1] && (results[0].score - results[1].score) <= Math.max(8, results[0].score * 0.12) && results[0].score >= 34;
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-precision-best-match sugo-fast-best-match">' +
      '<div class="v51-best-top"><span class="v51-best-badge">Fast Precision Match</span><span class="v51-best-score ' + conf.className + '">' + esc(conf.label + ' · ' + conf.score) + '</span></div>' +
      (ambiguous ? '<div class="v51-best-section" style="color:#92400e;font-weight:850;">⚠ Close matches — verify the case before sending.</div>' : '') + rows + '</div>';
  }
  function applyLiveResults(query, results){
    var q = String(query || '').trim();
    if(!q || q.length < 2){ clearLiveSearch(); return; }
    var useful = results.filter(function(t){ return t.score >= 18; }).slice(0, 60);
    if(!useful.length) useful = results.slice(0, 25);
    var ids = new Set(useful.map(function(t){ return t.id; }));
    var topIds = new Set(useful.slice(0, 5).map(function(t){ return t.id; }));
    var any = false;
    var index = getNavIndex();
    index.forEach(function(item){
      var visible = ids.has(item.id);
      setHidden(item.btn, !visible);
      if(visible) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var visible = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(sec, !visible);
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var visible = Array.prototype.some.call(cat.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(cat, !visible);
    });
    document.querySelectorAll('.nav-lroot').forEach(function(root){
      var visible = Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); });
      setHidden(root, !visible);
    });
    // Open only the first few matching paths. Opening every result was the main UI-freeze cause.
    document.querySelectorAll('.nav-lroot-children.open,.nav-l0-children.open,.nav-l00-children.open').forEach(function(el){ setOpen(el, false); });
    document.querySelectorAll('.nav-lroot-chev.open,.nav-l0-chev.open,.nav-l00-chev.open').forEach(function(el){ setOpen(el, false); });
    index.forEach(function(item){
      if(!topIds.has(item.id)) return;
      var rootChild = item.root && item.root.querySelector(':scope > .nav-lroot-children');
      var rootChev = item.root && item.root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev');
      var l0Child = item.l0 && item.l0.querySelector(':scope > .nav-l0-children');
      var l0Chev = item.l0 && item.l0.querySelector(':scope > .nav-l0-btn .nav-l0-chev');
      var l00Child = item.l00 && item.l00.querySelector(':scope > .nav-l00-children');
      var l00Chev = item.l00 && item.l00.querySelector(':scope > .nav-l00-btn .nav-l00-chev');
      setOpen(rootChild, true); setOpen(rootChev, true);
      setOpen(l0Child, true); setOpen(l0Chev, true);
      setOpen(l00Child, true); setOpen(l00Chev, true);
    });
    var nr = byId('noResults');
    if(nr) nr.style.display = any ? 'none' : 'block';
    renderBest(useful);
  }
  function fastLiveSearch(query){
    var q = String(query || '').trim();
    if(lastAppliedQuery === q) return;
    lastAppliedQuery = q;
    if(pendingFrame) cancelAnimationFrame(pendingFrame);
    if(!q || q.length < 2){
      pendingFrame = requestAnimationFrame(function(){ pendingFrame = null; clearLiveSearch(); });
      return;
    }
    var results = rankLite(q);
    pendingFrame = requestAnimationFrame(function(){
      pendingFrame = null;
      applyLiveResults(q, results);
    });
  }
  function resizeInput(el){
    try{
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 96) + 'px';
    }catch(e){}
  }
  function install(){
    buildNavIndex();
    window.sugoFastSearchInput = function(el){
      if(!el) return;
      resizeInput(el);
      if(isComposing) return;
      var value = String(el.value || '');
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function(){ fastLiveSearch(value); }, value.trim() ? liveWaitMs : 25);
    };
    window.doSearch = fastLiveSearch;
    try{ doSearch = fastLiveSearch; }catch(e){}
    if(window.SugoApp && window.SugoApp.navigation){ window.SugoApp.navigation.search = fastLiveSearch; }
  }
  document.addEventListener('compositionstart', function(e){ if(e.target && e.target.id === 'searchInput') isComposing = true; }, true);
  document.addEventListener('compositionend', function(e){
    if(e.target && e.target.id === 'searchInput'){
      isComposing = false;
      window.sugoFastSearchInput(e.target);
    }
  }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ setTimeout(install, 0); });
  window.SUGO_TYPING_LAG_HOTFIX = { version: VERSION, debounceMs: liveWaitMs, rebuildIndex: function(){ navIndex = null; return buildNavIndex(); }, search: fastLiveSearch };
})();
