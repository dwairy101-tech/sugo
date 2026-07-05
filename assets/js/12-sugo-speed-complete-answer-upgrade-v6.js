// Extracted from index(94).html: <script id="sugo-speed-complete-answer-upgrade-v6">
(function(){
  'use strict';
  if(window.__SUGO_SPEED_COMPLETE_ANSWER_V6__) return;
  window.__SUGO_SPEED_COMPLETE_ANSWER_V6__ = true;

  var VERSION = '6.0.0-speed-precision-complete';
  var debounceMs = 110;
  var bodyLimitPerTopic = 22000;
  var maxVisibleResults = 72;
  var maxOpenPaths = 4;
  var timer = null;
  var frame = null;
  var index = null;
  var composing = false;
  var oldGetRelevant = window.getRelevantKnowledgeBaseText;

  function esc(value){
    if(typeof window.escapeHtml === 'function') return window.escapeHtml(String(value || ''));
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
  function stripAl(t){ t = String(t || ''); return t.length > 4 && t.indexOf('ال') === 0 ? t.slice(2) : t; }
  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me please dear' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي رجاء').split(/\s+/).filter(Boolean));
  var GROUPS = (window.SUGO_PRECISION_SEARCH && window.SUGO_PRECISION_SEARCH.groups) || {};
  if(!Object.keys(GROUPS).length){
    GROUPS = {
      password:['password','باسورد','كلمة السر','كلمة السر','reset password'], phone:['phone','mobile','رقم الهاتف','هاتف','موبايل','ربط رقم','تغيير رقم'], sms:['sms','otp','code','كود','رمز التحقق'],
      ban:['ban','banned','blocked','حظر','محظور','باند','تقييد'], unban:['unban','appeal','فك حظر','رفع الحظر','استئناف'], report:['report','abuse','بلاغ','ابلاغ','اساءة','إساءة'],
      recharge:['recharge','payment','coins','invoice','شحن','دفع','كوين','فاتورة'], withdrawal:['withdrawal','salary','diamonds','سحب','راتب','ماسات'], agency:['agency','host','وكالة','وكاله','مضيف','مضيفه'],
      game:['game','games','لعبة','لعبه','العاب'], location:['location','country','distance','موقع','دولة','دوله','مسافة'], crash:['crash','bug','freeze','كراش','تعطل','يعلق']
    };
  }
  function tokens(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripAl).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }
  function has(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    return phrase.length <= 3 ? (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0 : hay.indexOf(phrase) >= 0;
  }
  function phraseVariants(value){
    var n = norm(value); if(!n) return [];
    var out = new Set([n]);
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripAl(t)); });
    return Array.from(out).filter(Boolean);
  }
  function expand(query){
    var q = norm(query);
    var original = tokens(query, false);
    var expanded = new Set(original);
    var groups = [];
    Object.keys(GROUPS).forEach(function(g){
      var terms = [];
      (GROUPS[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      if(terms.some(function(term){ return has(q, term); })){
        groups.push(g); expanded.add(g);
        terms.forEach(function(term){ tokens(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); });
      }
    });
    return { raw:q, original:original, expanded:Array.from(expanded), groups:groups };
  }
  function label(node, selector){
    try{ var span = node && node.querySelector(':scope > ' + selector + ' span'); return span ? (span.textContent || '').replace(/\s+/g,' ').trim() : ''; }catch(e){ return ''; }
  }
  function htmlToText(html){
    var tmp = document.createElement('div'); tmp.innerHTML = String(html || ''); return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }
  function paneText(id){
    try{
      if(typeof paneContent === 'undefined' || !paneContent[id]) return { en:'', ar:'', all:'' };
      var html = paneContent[id].en || paneContent[id].html || '';
      var tmp = document.createElement('div'); tmp.innerHTML = html;
      var divs = tmp.querySelectorAll('.lang-divider');
      var en = '', ar = '';
      if(divs.length >= 1 && divs[0].nextElementSibling) en = (divs[0].nextElementSibling.textContent || '').trim();
      if(divs.length >= 2 && divs[1].nextElementSibling) ar = (divs[1].nextElementSibling.textContent || '').trim();
      if(!en && !ar) en = htmlToText(html);
      return { en:en, ar:ar, all:[en, ar].join('\n') };
    }catch(e){ return { en:'', ar:'', all:'' }; }
  }
  function buildIndex(){
    var buttons = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn[data-pane]'));
    index = buttons.map(function(btn){
      var id = btn.getAttribute('data-pane') || '';
      var l00 = btn.closest('.nav-l00'), l0 = btn.closest('.nav-l0'), root = btn.closest('.nav-lroot');
      var title = (btn.textContent || '').replace(/\s+/g, ' ').trim() || id.replace(/-/g, ' ');
      var section = label(l00, '.nav-l00-btn'), category = label(l0, '.nav-l0-btn'), library = label(root, '.nav-lroot-btn');
      var path = [library, category, section].filter(Boolean).join(' › ');
      var text = paneText(id);
      var titleNorm = norm([id.replace(/-/g,' '), title].join(' '));
      var pathNorm = norm(path);
      var bodyNorm = norm(text.all).slice(0, 42000);
      return { id:id, btn:btn, l00:l00, l0:l0, root:root, title:title, section:section, category:category, library:library, path:path, enText:text.en, arText:text.ar, titleNorm:titleNorm, pathNorm:pathNorm, bodyNorm:bodyNorm, allNorm:norm([id.replace(/-/g,' '), title, path, text.all].join(' ')).slice(0, 52000) };
    });
    return index;
  }
  function getIndex(){ return index || buildIndex(); }
  function score(item, info){
    var score = 0, hits = [];
    if(info.raw && info.raw.length >= 3){
      if(has(item.titleNorm, info.raw)){ score += 110; hits.push(info.raw); }
      else if(has(item.pathNorm, info.raw)){ score += 70; hits.push(info.raw); }
      else if(has(item.bodyNorm, info.raw)){ score += 38; hits.push(info.raw); }
      else if(has(item.allNorm, info.raw)){ score += 28; hits.push(info.raw); }
    }
    info.groups.forEach(function(g){
      var terms = [];
      (GROUPS[g] || []).forEach(function(term){ phraseVariants(term).forEach(function(v){ terms.push(v); }); });
      if(terms.some(function(t){ return has(item.titleNorm, t); })){ score += 54; hits.push(g); }
      else if(terms.some(function(t){ return has(item.pathNorm, t); })){ score += 36; hits.push(g); }
      else if(terms.some(function(t){ return has(item.bodyNorm, t); })){ score += 20; hits.push(g); }
    });
    info.expanded.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(has(item.titleNorm, w)){ score += 22; hits.push(w); }
      else if(item.titleNorm.indexOf(w) >= 0){ score += 14; hits.push(w); }
      if(has(item.pathNorm, w)){ score += 12; hits.push(w); }
      else if(item.pathNorm.indexOf(w) >= 0){ score += 7; hits.push(w); }
      if(has(item.bodyNorm, w)){ score += 4.8; hits.push(w); }
    });
    var coverage = info.original.length ? info.original.filter(function(t){ return has(item.allNorm, t); }).length / info.original.length : 0;
    if(coverage >= 0.8) score += 22;
    else if(coverage >= 0.55) score += 13;
    else if(info.original.length >= 3 && coverage < 0.34) score -= 10;
    if(/optimized|placeholder/.test(item.id)) score -= 4;
    return Object.assign({}, item, { score:Math.max(0, score), hits:Array.from(new Set(hits)).slice(0,8), coverage:Math.round(coverage*100)/100 });
  }
  function rank(query){
    var info = expand(query);
    return getIndex().map(function(item){ return score(item, info); }).filter(function(x){ return x.score > 0; }).sort(function(a,b){
      if(b.score !== a.score) return b.score - a.score;
      if(b.coverage !== a.coverage) return b.coverage - a.coverage;
      return String(a.title || '').localeCompare(String(b.title || ''));
    });
  }
  function setHidden(el, hidden){ if(!el) return; el.classList.toggle('hidden-search', !!hidden); }
  function setOpen(el, open){ if(!el) return; el.classList.toggle('open', !!open); }
  function clearSearch(){
    getIndex().forEach(function(item){ setHidden(item.btn, false); });
    document.querySelectorAll('.nav-l00,.nav-l0,.nav-lroot').forEach(function(el){ setHidden(el, false); });
    var nr = document.getElementById('noResults'); if(nr) nr.style.display = 'none';
    var panel = document.getElementById('v51BestMatchPanel'); if(panel){ panel.style.display='none'; panel.innerHTML=''; }
  }
  function confidence(best, second){
    if(!best) return { label:'Low', className:'ai-source-low', score:0 };
    var gap = second ? best.score - second.score : best.score;
    var high = best.score >= 90 && gap >= Math.max(10, best.score * 0.1);
    var medium = best.score >= 38;
    return { label: high ? 'High' : (medium ? 'Medium' : 'Low'), className: high ? 'ai-source-high' : (medium ? 'ai-source-medium' : 'ai-source-low'), score:Math.round(best.score*10)/10 };
  }
  function renderBest(results){
    var panel = document.getElementById('v51BestMatchPanel'); if(!panel) return;
    if(!results.length){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var conf = confidence(results[0], results[1]);
    var rows = results.slice(0, 4).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i+1) + '. ' + (t.title || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + Math.round((t.score || 0)*10)/10 + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,5).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-turbo-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-turbo-ask="' + esc(t.title || t.id) + '" data-sugo-turbo-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-turbo-best-match"><div class="v51-best-top"><span class="v51-best-badge">Turbo Precision Match</span><span class="v51-best-score ' + conf.className + '">' + esc(conf.label + ' · ' + conf.score) + '</span></div>' + rows + '</div>';
  }
  function apply(query, results){
    var q = String(query || '').trim();
    if(!q || q.length < 2){ clearSearch(); return; }
    var useful = results.filter(function(t){ return t.score >= 18; }).slice(0, maxVisibleResults);
    if(!useful.length) useful = results.slice(0, 28);
    var ids = new Set(useful.map(function(t){ return t.id; }));
    var topIds = new Set(useful.slice(0, maxOpenPaths).map(function(t){ return t.id; }));
    var any = false;
    getIndex().forEach(function(item){ var visible = ids.has(item.id); setHidden(item.btn, !visible); if(visible) any = true; });
    document.querySelectorAll('.nav-l00').forEach(function(sec){ setHidden(sec, !Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-l0').forEach(function(cat){ setHidden(cat, !Array.prototype.some.call(cat.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-lroot').forEach(function(root){ setHidden(root, !Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(btn){ return ids.has(btn.getAttribute('data-pane')); })); });
    document.querySelectorAll('.nav-lroot-children.open,.nav-l0-children.open,.nav-l00-children.open,.nav-lroot-chev.open,.nav-l0-chev.open,.nav-l00-chev.open').forEach(function(el){ setOpen(el, false); });
    getIndex().forEach(function(item){
      if(!topIds.has(item.id)) return;
      setOpen(item.root && item.root.querySelector(':scope > .nav-lroot-children'), true);
      setOpen(item.root && item.root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev'), true);
      setOpen(item.l0 && item.l0.querySelector(':scope > .nav-l0-children'), true);
      setOpen(item.l0 && item.l0.querySelector(':scope > .nav-l0-btn .nav-l0-chev'), true);
      setOpen(item.l00 && item.l00.querySelector(':scope > .nav-l00-children'), true);
      setOpen(item.l00 && item.l00.querySelector(':scope > .nav-l00-btn .nav-l00-chev'), true);
    });
    var nr = document.getElementById('noResults'); if(nr) nr.style.display = any ? 'none' : 'block';
    renderBest(useful);
  }
  function turboSearch(query){
    var q = String(query || '').trim();
    if(frame) cancelAnimationFrame(frame);
    if(!q || q.length < 2){ frame = requestAnimationFrame(function(){ frame=null; clearSearch(); }); return; }
    var results = rank(q);
    frame = requestAnimationFrame(function(){ frame=null; apply(q, results); });
  }
  function resize(el){ try{ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight, 104)+'px'; }catch(e){} }

  window.sugoFastSearchInput = function(el){
    if(!el) return;
    resize(el);
    if(composing) return;
    clearTimeout(timer);
    var value = String(el.value || '');
    timer = setTimeout(function(){ turboSearch(value); }, value.trim() ? debounceMs : 20);
  };
  window.doSearch = turboSearch;
  try{ doSearch = turboSearch; }catch(e){}
  if(window.SugoApp && window.SugoApp.navigation) window.SugoApp.navigation.search = turboSearch;

  function noEllipsisClip(text, limit){
    text = String(text || '');
    if(text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var lastStop = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '), cut.lastIndexOf('۔'), cut.lastIndexOf('؟'));
    if(lastStop > limit * 0.72) cut = cut.slice(0, lastStop + 1);
    else cut = cut.replace(/\s+\S*$/, '');
    return cut + '\n[Content continues in the selected SOP article; answer must not stop mid-sentence. Ask a follow-up or open the SOP if the remaining article is needed.]';
  }
  window.getRelevantKnowledgeBaseText = function(query, maxTopics, maxCharsPerTopic, preferredPaneId, options){
    options = options && typeof options === 'object' ? options : {};
    maxTopics = Math.max(Number(maxTopics || 0), options.completeAnswer ? 12 : 8);
    maxCharsPerTopic = Math.max(Number(maxCharsPerTopic || 0), options.completeAnswer ? 3200 : 1800);
    var result = typeof oldGetRelevant === 'function'
      ? oldGetRelevant(query, maxTopics, maxCharsPerTopic, preferredPaneId, options)
      : { topics: rank(query).slice(0, maxTopics), confidence:'low', confidenceLabel:'Low', confidenceScore:0, hasMeaningfulMatch:false };
    var topics = Array.isArray(result.topics) ? result.topics.slice(0, maxTopics) : [];
    if(!topics.length) return result;
    var routeLine = result.primaryRoute ? ('Primary route: ' + result.primaryRoute.name + '\nPrimary topic IDs: ' + (result.primaryTopicIds || []).join(', ')) : 'Primary route: none';
    var audit = topics.slice(0, 8).map(function(t, i){ return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + Math.round((t.score || 0)*10)/10 + ' | hits: ' + ((t.hits || []).slice(0,8).join(', ') || 'none'); }).join('\n');
    var packet = routeLine + '\nCompleteness rule: use every relevant condition, exception, required evidence, and escalation detail from the matched SOP. Finish all sections fully; never stop mid-list or mid-sentence.\nMatch audit:\n' + audit + '\n\n' + topics.map(function(t, i){
      var priority = t.primary || t.selected || i < 3;
      var enLimit = priority ? bodyLimitPerTopic : Math.max(7000, maxCharsPerTopic * 2);
      var arLimit = priority ? bodyLimitPerTopic : Math.max(6500, Math.floor(maxCharsPerTopic * 1.8));
      return [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + Math.round((t.score || 0)*10)/10,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        t.selected ? 'Selected by user: yes' : 'Selected by user: no',
        (t.tags && t.tags.length ? 'Tags: ' + t.tags.join(', ') : ''),
        'English SOP:', noEllipsisClip(t.enText || '', enLimit),
        '', 'Arabic SOP:', noEllipsisClip(t.arText || '', arLimit)
      ].filter(function(x){ return x !== null && x !== undefined; }).join('\n');
    }).join('\n\n');
    result.text = packet;
    result.topics = topics;
    result.topicIds = topics.map(function(t){ return t.id; });
    result.hasMeaningfulMatch = result.hasMeaningfulMatch || topics.length > 0;
    return result;
  };

  document.addEventListener('compositionstart', function(e){ if(e.target && e.target.id === 'searchInput') composing = true; }, true);
  document.addEventListener('compositionend', function(e){ if(e.target && e.target.id === 'searchInput'){ composing = false; window.sugoFastSearchInput(e.target); } }, true);
  document.addEventListener('click', function(e){
    var open = e.target.closest && e.target.closest('[data-sugo-turbo-open]');
    if(open){ e.preventDefault(); var paneId = open.getAttribute('data-sugo-turbo-open'); if(paneId && typeof window.showPane === 'function') window.showPane(paneId, true); return; }
    var ask = e.target.closest && e.target.closest('[data-sugo-turbo-ask]');
    if(ask){
      e.preventDefault();
      var q = ask.getAttribute('data-sugo-turbo-ask') || '';
      var pane = ask.getAttribute('data-sugo-turbo-pane') || '';
      if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
      var input = document.getElementById('searchInput'); if(input) input.value = q;
      if(typeof window.askAI === 'function') window.askAI(q);
    }
  }, true);
  function boot(){
    buildIndex();
    setTimeout(function(){ index = null; buildIndex(); }, 800);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.addEventListener('load', function(){ setTimeout(function(){ index = null; buildIndex(); }, 50); });
  window.SUGO_SPEED_COMPLETE_ANSWER = { version:VERSION, debounceMs:debounceMs, rebuildIndex:function(){ index = null; return buildIndex(); }, rank:rank, search:turboSearch };
})();
