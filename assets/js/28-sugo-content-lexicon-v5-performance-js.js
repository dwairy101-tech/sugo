(function(){
  'use strict';
  if(window.__SUGO_CONTENT_LEXICON_V5_PERFORMANCE__) return;
  window.__SUGO_CONTENT_LEXICON_V5_PERFORMANCE__ = true;

  var VERSION = '5.0-performance-safe-on-demand-lexicon';
  var oldGetRelevant = window.getRelevantKnowledgeBaseText;
  var oldDoSearch = window.doSearch;
  var searchTimer = null;

  function norm(value){
    return String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[إأآا]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/ـ/g, '')
      .replace(/&(?:nbsp|amp|quot|lt|gt);/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  var STOP = new Set('the is a an to of and or for in on with from please customer client issue problem case request reply ticket details profile professional tone dear hello hi we need additional information complete review provide following information first second third fourth fifth sixth seventh account id شكرا شكراً مرحبا مرحباً عزيزي العميل خدمة عملاء سوجو يرجى الرجاء نعتذر المشكلة الحالية التي تواجهك من في على عن الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكلة مشكله موضوع حالة حاله طلب رد تذكرة تذكره'.split(/\s+/));

  function paneMap(){
    try{ if(typeof paneContent !== 'undefined' && paneContent) return paneContent; }catch(e){}
    try{ if(window.paneContent) return window.paneContent; }catch(e){}
    return {};
  }

  function tokenList(value){
    return norm(value).split(/\s+/).filter(function(t){ return t && t.length > 1 && !STOP.has(t); });
  }

  function ngrams(tokens, min, max){
    var out = [];
    for(var n = min; n <= max; n++){
      if(tokens.length < n) continue;
      for(var i = 0; i <= tokens.length - n; i++) out.push(tokens.slice(i, i+n).join(' '));
    }
    return out;
  }

  function metaFor(paneId){
    var title = '', category = '', section = '', library = '';
    try{
      var btn = document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]');
      if(btn) title = (btn.textContent || '').trim();
      var sec = btn && btn.closest('.nav-l00');
      var cat = btn && btn.closest('.nav-l0');
      var root = btn && btn.closest('.nav-lroot');
      function text(node, selector){ var el = node && node.querySelector(selector); return (el && el.textContent || '').trim(); }
      section = text(sec, ':scope > .nav-l00-btn span') || '';
      category = text(cat, ':scope > .nav-l0-btn span') || '';
      library = text(root, ':scope > .nav-lroot-btn span') || '';
    }catch(e){}
    if(!title) title = String(paneId || '').replace(/^sv-tickets-/, '').replace(/^sv-refined-/, '').replace(/^sc-/, '').replace(/-/g, ' ');
    return { title:title, category:category, section:section, library:library, path:[library, category, section].filter(Boolean).join(' › ') };
  }

  function directRoute(query){
    var q = norm(query);
    if(!q) return null;
    var hasAgency = /(وكاله|وكالة|agency|agent|host|anchor|مضيف|مضيفه|مذيع|مذيعه)/.test(q);
    if(hasAgency){
      if(/(شحن|recharge|top up|topup|coins|كوين|دفع|payment)/.test(q)) return { id:'sv-tickets-agency-create-recharge', reason:'direct: recharge agency' };
      if(/(فرعي|فرعيه|فرعية|sub agency|subagency)/.test(q) && /(تحويل|ترقيه|ترقية|main|اساسي|اساسية)/.test(q)) return { id:'sv-tickets-agency-change-sub-to-main', reason:'direct: sub to main agency' };
      if(/(فرعي|فرعيه|فرعية|sub agency|subagency)/.test(q)) return { id:'sv-tickets-agency-create-sub', reason:'direct: sub agency' };
      if(/(واتساب|whatsapp|جروب|قروب|اداري|ادارة|management group)/.test(q)) return { id:'sv-tickets-agency-admin-whatsapp-group', reason:'direct: agency whatsapp group' };
      if(/(نقل|تحويل|تغيير|change|transfer)/.test(q) && /(مضيف|مضيفه|anchor|host|وكاله|وكالة|agency)/.test(q)) return { id:'sv-tickets-agency-change-anchor', reason:'direct: change agency anchor' };
      if(/(انشاء|انشا|فتح|تقديم|طلب|create|open|apply|new)/.test(q)) return { id:'sv-tickets-agency-create', reason:'direct: create agency' };
    }
    return null;
  }

  function queryAliases(q){
    var out = new Set();
    var n = norm(q);
    if(n) out.add(n);
    [
      [/\bوكاله\b/g, 'وكالة'], [/\bوكالة\b/g, 'وكاله'],
      [/\bانشا\b/g, 'انشاء'], [/\bإنشاء\b/g, 'انشاء'],
      [/\bفتح\b/g, 'انشاء'], [/\bopen\b/g, 'create'], [/\bapply\b/g, 'create'],
      [/\bمضيفات\b/g, 'host'], [/\bمضيفه\b/g, 'host'], [/\bمذيعه\b/g, 'anchor']
    ].forEach(function(pair){ if(n) out.add(n.replace(pair[0], pair[1])); });
    return Array.from(out).filter(Boolean);
  }

  function rawTextFor(id){
    var map = paneMap();
    var html = (map[id] && (map[id].en || map[id].html)) || '';
    return String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/data-copy-text="[^"]*"/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;|&#160;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/\s+/g, ' ')
      .slice(0, 24000); // cap per topic for CPU safety; full SOP is still used for final packet when selected
  }

  function scoreOne(id, query){
    var qn = norm(query);
    if(!qn) return null;
    var meta = metaFor(id);
    var titleNorm = norm([id.replace(/-/g,' '), meta.title].join(' '));
    var pathNorm = norm(meta.path);
    var textNorm = norm(rawTextFor(id));
    var combinedTitle = titleNorm + ' ' + pathNorm;
    var tokens = tokenList(query);
    var qgrams = ngrams(tokens, 2, Math.min(5, tokens.length));
    var score = 0, hits = [];
    queryAliases(query).forEach(function(a){
      if(!a) return;
      if(titleNorm === a){ score += 150; hits.push('exact-title'); }
      else if((' ' + titleNorm + ' ').indexOf(' ' + a + ' ') >= 0 || titleNorm.indexOf(a) >= 0){ score += 95; hits.push(a); }
      if(pathNorm.indexOf(a) >= 0){ score += 45; hits.push('path:' + a); }
      if(textNorm.indexOf(a) >= 0){ score += 20; hits.push(a); }
    });
    var tokenHits = 0;
    tokens.forEach(function(t){
      if(combinedTitle.indexOf(t) >= 0){ score += 15; tokenHits++; hits.push(t); }
      else if(textNorm.indexOf(t) >= 0){ score += 3.5; tokenHits++; hits.push(t); }
    });
    if(tokens.length){
      var coverage = tokenHits / tokens.length;
      if(coverage >= 1) score += 28;
      else if(coverage >= 0.66) score += 14;
      else if(tokens.length >= 2 && coverage < 0.5) score -= 16;
    }
    qgrams.forEach(function(g){
      if(combinedTitle.indexOf(g) >= 0){ score += 20; hits.push(g); }
      else if(textNorm.indexOf(g) >= 0){ score += 6; hits.push(g); }
    });
    var lowerId = String(id || '').toLowerCase();
    if(/(وكاله|وكالة|agency)/.test(qn) && !/(agency|host|anchor)/.test(lowerId + ' ' + combinedTitle + ' ' + textNorm)) score -= 35;
    if(/(انشاء|انشا|فتح|create|open|apply)/.test(qn) && /^sv-tickets-/.test(lowerId)) score += 9;
    if(/^sv-tickets-/.test(lowerId)) score += 4;
    score = Math.max(0, score);
    if(score <= 0) return null;
    return { id:id, score:Math.round(score*10)/10, hits:Array.from(new Set(hits)).slice(0, 10), primary:false, meta:meta };
  }

  function rankByLexicon(query, limit){
    var map = paneMap();
    var keys = Object.keys(map || {});
    var direct = directRoute(query);
    var ranked = [];
    for(var i = 0; i < keys.length; i++){
      var item = scoreOne(keys[i], query);
      if(item) ranked.push(item);
    }
    ranked.sort(function(a,b){
      if(b.score !== a.score) return b.score - a.score;
      var at = /^sv-tickets-/.test(a.id), bt = /^sv-tickets-/.test(b.id);
      if(at !== bt) return at ? -1 : 1;
      return String(a.id).localeCompare(String(b.id));
    });
    if(direct && map[direct.id]){
      var existing = ranked.find(function(r){ return r.id === direct.id; });
      if(existing){ existing.score = Math.max(existing.score, 999); existing.primary = true; existing.hits.unshift(direct.reason); }
      else ranked.unshift({ id:direct.id, score:999, hits:[direct.reason], primary:true, meta:metaFor(direct.id) });
      ranked = ranked.filter(function(item, idx, arr){ return arr.findIndex(function(x){ return x.id === item.id; }) === idx; });
    }
    return ranked.slice(0, limit || 12);
  }

  function extractTopicText(id){
    var map = paneMap();
    var html = (map[id] && (map[id].en || map[id].html)) || '';
    var text = '';
    try{
      var tmp = document.createElement('div');
      tmp.innerHTML = String(html || '');
      text = (tmp.textContent || tmp.innerText || '').replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
    }catch(e){ text = rawTextFor(id); }
    return text;
  }

  function clip(text, limit){
    text = String(text || '');
    limit = Number(limit || 5200);
    if(text.length <= limit) return text;
    var cut = text.slice(0, limit);
    var stop = Math.max(cut.lastIndexOf('\n\n'), cut.lastIndexOf('. '), cut.lastIndexOf('؟'), cut.lastIndexOf('!'));
    if(stop > limit * 0.65) cut = cut.slice(0, stop + 1);
    else cut = cut.replace(/\s+\S*$/, '');
    return cut + ' …';
  }

  function topicFromRank(r){
    var meta = r.meta || metaFor(r.id);
    var txt = extractTopicText(r.id);
    return {
      id:r.id,
      title:meta.title,
      label:meta.title || r.id.replace(/-/g, ' '),
      category:meta.category,
      section:meta.section,
      library:meta.library,
      path:meta.path,
      enText:txt,
      arText:'',
      allText:norm(txt).slice(0, 9000),
      score:r.score,
      hits:r.hits || [],
      tags:[],
      primary:!!r.primary,
      selected:false,
      confidence:r.primary || r.score >= 70 ? 'high' : r.score >= 28 ? 'medium' : 'low'
    };
  }

  function rebuildPacket(base, topics, maxCharsPerTopic){
    base = base || {};
    maxCharsPerTopic = Math.max(Number(maxCharsPerTopic || 0), 2600);
    var audit = topics.slice(0, 8).map(function(t, i){
      return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + (Math.round((t.score || 0)*10)/10) + ' | hits: ' + ((t.hits || []).slice(0,8).join(', ') || 'content-lexicon');
    }).join('\n');
    var routeLine = topics[0] ? ('Primary route: ' + topics[0].id + '\nPrimary topic IDs: ' + topics.map(function(t){return t.id;}).slice(0,5).join(', ')) : 'Primary route: none';
    base.text = routeLine + '\nContent lexicon: performance-safe on-demand scan. Use exact matched Ticket macro before broad articles.\nMatch audit:\n' + audit + '\n\n' + topics.map(function(t, i){
      var limit = (t.primary || i < 2) ? Math.max(maxCharsPerTopic, 7200) : maxCharsPerTopic;
      return [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + Math.round((t.score || 0)*10)/10,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        'SOP:', clip(t.enText || '', limit)
      ].join('\n');
    }).join('\n\n');
    base.topics = topics;
    base.topicIds = topics.map(function(t){ return t.id; });
    base.bestTopic = topics[0] || null;
    var bestScore = topics[0] ? Number(topics[0].score || 0) : 0;
    base.confidence = bestScore >= 70 || (topics[0] && topics[0].primary) ? 'high' : bestScore >= 28 ? 'medium' : (base.confidence || 'low');
    base.confidenceLabel = base.confidence === 'high' ? 'High' : base.confidence === 'medium' ? 'Medium' : 'Low';
    base.confidenceScore = Math.max(Number(base.confidenceScore || 0), Math.round(bestScore*10)/10);
    base.hasMeaningfulMatch = topics.length > 0;
    base.contentLexiconV5 = true;
    return base;
  }

  window.getRelevantKnowledgeBaseText = function(query, maxTopics, maxCharsPerTopic, preferredPaneId, options){
    options = options && typeof options === 'object' ? options : {};
    maxTopics = Math.max(Number(maxTopics || 0), options.completeAnswer ? 10 : 7);
    var ranked = rankByLexicon(query, Math.max(maxTopics, 10));
    var direct = ranked[0] && ranked[0].primary;
    var strong = ranked[0] && ranked[0].score >= 58;
    var base = null;
    // Do not call the old heavier search when the direct/content match is already strong.
    // This keeps Create Ticket fast and prevents memory spikes.
    if(!direct && !strong && typeof oldGetRelevant === 'function'){
      try{ base = oldGetRelevant(query, maxTopics, maxCharsPerTopic, preferredPaneId, options); }catch(e){ base = null; }
    }
    if(!ranked.length){
      return base || { topics:[], topicIds:[], confidence:'low', confidenceLabel:'Low', confidenceScore:0, hasMeaningfulMatch:false, text:'' };
    }
    var baseTopics = base && Array.isArray(base.topics) ? base.topics.slice(0, maxTopics) : [];
    var lexTopics = ranked.map(topicFromRank);
    var merged = lexTopics.concat(baseTopics.filter(function(t){ return !lexTopics.some(function(x){ return x.id === t.id; }); })).slice(0, maxTopics);
    return rebuildPacket(base || {}, merged, maxCharsPerTopic);
  };
  try{ getRelevantKnowledgeBaseText = window.getRelevantKnowledgeBaseText; }catch(e){}

  function applySearchResults(q){
    var ranked = rankByLexicon(q, 70);
    if(!ranked.length){ if(typeof oldDoSearch === 'function') return oldDoSearch(q); return; }
    var ids = new Set(ranked.filter(function(r){ return r.primary || r.score >= 18; }).map(function(r){ return r.id; }));
    if(!ids.size) ranked.slice(0, 20).forEach(function(r){ ids.add(r.id); });
    var any = false;
    document.querySelectorAll('.nav-l000-btn[data-pane]').forEach(function(btn){
      var id = btn.getAttribute('data-pane');
      var match = ids.has(id);
      btn.classList.toggle('hidden-search', !match);
      if(match) any = true;
    });
    document.querySelectorAll('.nav-l00').forEach(function(sec){
      var vis = Array.prototype.some.call(sec.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      sec.classList.toggle('hidden-search', !vis);
      var child = sec.querySelector(':scope > .nav-l00-children'); if(vis && child) child.classList.add('open');
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var vis = Array.prototype.some.call(cat.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); });
      cat.classList.toggle('hidden-search', !vis);
      var child = cat.querySelector(':scope > .nav-l0-children'); if(vis && child) child.classList.add('open');
    });
    var nr = document.getElementById('noResults'); if(nr) nr.style.display = any ? 'none' : 'block';
  }

  window.doSearch = function(query){
    var q = String(query || '').trim();
    if(!q || q.length < 2){
      if(searchTimer) clearTimeout(searchTimer);
      if(typeof oldDoSearch === 'function') return oldDoSearch.apply(this, arguments);
      return;
    }
    if(searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function(){ applySearchResults(q); }, 160);
  };
  try{ doSearch = window.doSearch; }catch(e){}

  // Extra DOM/memory guard: if any old code leaves closed panes in the DOM, remove them.
  function trimClosedPanes(){
    try{
      var active = window.SUGO_ACTIVE_PANE ? 'pane-' + window.SUGO_ACTIVE_PANE : '';
      document.querySelectorAll('.content-pane[data-lazy="1"]').forEach(function(p){
        if(!active || p.id !== active) p.remove();
      });
    }catch(e){}
  }
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('.nav-l000-btn[data-pane]')) setTimeout(trimClosedPanes, 250);
  }, true);

  // No eager build here. The content is scanned only when the user searches or asks AI.
  window.SUGO_CONTENT_LEXICON_V5 = { version:VERSION, rank:rankByLexicon, directRoute:directRoute, trimClosedPanes:trimClosedPanes };
})();
