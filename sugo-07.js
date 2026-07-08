(function(){
  'use strict';

  var PRECISION_VERSION = '4.0.0';
  var topicCache = null;

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
    if(token.length > 4 && token.indexOf('ال') === 0) return token.slice(2);
    return token;
  }

  var STOP = new Set(('the is a an to of and or for in on how what do does did i my it this that with can are be please explain whole process from you need customer client issue problem case help me' +
    ' من في على عن هل كيف ما ماذا الى إلى او أو مع هذا هذه لو اذا إذا بدي اريد أريد شو ليش العميل المستخدم مشكله مشكلة موضوع حاله حالة بسبب عند عندي انا انت هو هي').split(/\s+/).filter(Boolean));

  var GROUPS = {
    password: ['password','pass','باسورد','باسوورد','كلمة السر','كلمه مرور','كلمة السر','كلمة مرور','نسيت الباسورد','استرجاع كلمة السر','reset password','password reset','recovery','recover'],
    login: ['login','sign in','signin','تسجيل دخول','دخول','لا يدخل','ما بيفتح','account login','login issue'],
    phone: ['phone','mobile','number','رقم','هاتف','موبايل','رقم الهاتف','ربط رقم','تغيير رقم','linked phone','binding phone','bind phone','unbind phone'],
    sms: ['sms','otp','code','verification code','رساله تحقق','رسالة تحقق','كود','رمز','رمز التحقق','كود التحقق','ما وصلني الكود'],
    binding: ['binding','bind','linked','unlink','ربط','فك ربط','تغيير الربط','ربط الحساب','phone binding'],
    ban: ['ban','banned','blocked','restriction','restricted','suspended','حظر','محظور','باند','موقوف','ايقاف','إيقاف','تقييد'],
    unban: ['unban','appeal','review ban','restore account','فك حظر','رفع الحظر','الغاء الحظر','إلغاء الحظر','استئناف','مراجعه الحظر','مراجعة الحظر'],
    report: ['report','abuse','complaint','violator','evidence','بلاغ','ابلاغ','شكوى','اساءه','إساءة','مخالف','دليل','سكرين','لقطه','لقطة','فيديو'],
    sexual: ['sexual','sex','porn','nudity','nude','explicit','جنسي','جنسية','إباحي','اباحي','عري','تعري','ايحاء','إيحاء'],
    recharge: ['recharge','topup','charge','payment','pay','coins','coin','purchase','order','transaction','invoice','receipt','شحن','دفع','كوين','كوينز','عملات','فاتوره','فاتورة','ايصال','إيصال','شراء','عملية','عمليه'],
    refund: ['refund','استرداد','ارجاع مبلغ','رجع الفلوس','reversal','rejected payment'],
    withdrawal: ['withdraw','withdrawal','cashout','salary','payout','diamonds','exchange','سحب','راتب','تحويل','استبدال','ماسات','الماس','مستحقات'],
    agency: ['agency','agent','agm','bcm','subagency','mainagency','وكاله','وكالة','وكيل','وكيلة','وكاله فرعيه','وكالة فرعية','وكاله رئيسيه','وكالة رئيسية'],
    host: ['host','anchor','hostess','مضيف','مضيفه','مذيع','مذيعه','مذيعة','انضمام مضيفه','join agency'],
    vip: ['vip','svip','charm','level','في اي بي','الجاذبيه','الجاذبية','شارم','مستوى'],
    game: ['game','games','لعبه','لعبة','العاب','ألعاب','روم العاب','room game','pk'],
    location: ['location','gps','nearby','distance','country','region','موقع','دوله','دولة','بلد','منطقه','منطقة','مسافه','مسافة','قريب'],
    country: ['change country','country change','تغيير الدوله','تغيير الدولة','تغيير بلد','الدوله الحاليه','الدولة الحالية'],
    gender: ['gender','sex change','تغيير الجنس','جنس الحساب','ذكر','انثى','أنثى'],
    room: ['room','live','broadcast','لايف','بث','غرفه','غرفة','روم'],
    message: ['message','messages','chat','dm','inbox','رساله','رسالة','رسائل','شات','دردشه','دردشة','خاص'],
    moment: ['moment','moments','post','feed','لحظات','منشور','بوست'],
    task: ['task','tasks','daily task','family task','مهمه','مهمة','مهام','يوميه','يومية','عائله','عائلة'],
    crash: ['crash','bug','freeze','not working','technical','كراش','تعطل','يعلق','لا يعمل','مشكله تقنيه','مشكلة تقنية'],
    family: ['family','families','عائلة','عائله','فاميلي'],
    gift: ['gift','gifts','send gift','receive gift','هدية','هديه','هدايا']
  };

  var GROUP_WEIGHTS = {
    password: 26, login: 20, phone: 24, sms: 24, binding: 24,
    ban: 28, unban: 36, report: 28, sexual: 32,
    recharge: 30, refund: 26, withdrawal: 30,
    agency: 24, host: 22, vip: 18, game: 20,
    location: 18, country: 24, gender: 18, room: 15,
    message: 18, moment: 18, task: 18, crash: 20,
    family: 14, gift: 12
  };

  function phraseVariants(value){
    var n = norm(value);
    if(!n) return [];
    var out = new Set([n]);
    out.add(stripArabicArticle(n));
    n.split(/\s+/).forEach(function(t){ if(t) out.add(stripArabicArticle(t)); });
    return Array.from(out).filter(Boolean);
  }

  function groupTerms(group){
    return (GROUPS[group] || []).flatMap(phraseVariants);
  }

  function tokenList(value, keepStop){
    var n = norm(value);
    if(!n) return [];
    var arr = n.split(/\s+/).map(stripArabicArticle).filter(function(t){ return t && t.length > 1; });
    if(!keepStop) arr = arr.filter(function(t){ return !STOP.has(t); });
    return Array.from(new Set(arr));
  }

  function hasPhrase(hay, phrase){
    phrase = norm(phrase);
    if(!phrase) return false;
    if(phrase.length <= 3) return (' ' + hay + ' ').indexOf(' ' + phrase + ' ') >= 0;
    return hay.indexOf(phrase) >= 0;
  }

  function matchedGroups(query){
    var q = norm(query);
    var padded = ' ' + q + ' ';
    var groups = [];
    Object.keys(GROUPS).forEach(function(g){
      var ok = groupTerms(g).some(function(term){
        if(!term) return false;
        return term.length <= 3 ? padded.indexOf(' ' + term + ' ') >= 0 : q.indexOf(term) >= 0;
      });
      if(ok) groups.push(g);
    });
    return groups;
  }

  function expandQuery(query){
    var original = tokenList(query, false);
    var groups = matchedGroups(query);
    var expanded = new Set(original);
    groups.forEach(function(g){ groupTerms(g).forEach(function(term){ tokenList(term, true).forEach(function(t){ if(!STOP.has(t)) expanded.add(t); }); expanded.add(g); }); });
    return { raw: norm(query), original: original, expanded: Array.from(expanded), groups: groups };
  }

  function navTextFor(node, selector){
    try{
      var el = node && node.querySelector(':scope > ' + selector + ' span');
      return el ? (el.textContent || '').trim() : '';
    }catch(e){ return ''; }
  }

  function getButtonMeta(paneId){
    var btn = null;
    try{ btn = document.querySelector('.nav-l000-btn[data-pane="' + CSS.escape(paneId) + '"]'); }catch(e){
      btn = Array.prototype.find.call(document.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return b.getAttribute('data-pane') === paneId; });
    }
    if(!btn) return { title: paneId.replace(/-/g, ' '), category: '', section: '', library: '', path: '' };
    var l00 = btn.closest('.nav-l00');
    var l0 = btn.closest('.nav-l0');
    var root = btn.closest('.nav-lroot');
    var library = navTextFor(root, '.nav-lroot-btn');
    var category = navTextFor(l0, '.nav-l0-btn');
    var section = navTextFor(l00, '.nav-l00-btn');
    var title = (btn.textContent || '').trim() || paneId.replace(/-/g, ' ');
    var path = [library, category, section].filter(Boolean).join(' › ');
    return { title: title, category: category, section: section, library: library, path: path };
  }

  function htmlToText(html){
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
  }

  function extractLangText(contentMap){
    var html = contentMap && (contentMap.en || contentMap.html || '');
    var tmp = document.createElement('div');
    tmp.innerHTML = String(html || '');
    var dividers = tmp.querySelectorAll('.lang-divider');
    var enText = '', arText = '';
    if(dividers.length >= 1 && dividers[0].nextElementSibling) enText = (dividers[0].nextElementSibling.textContent || '').trim();
    if(dividers.length >= 2 && dividers[1].nextElementSibling) arText = (dividers[1].nextElementSibling.textContent || '').trim();
    if(!enText && !arText) enText = htmlToText(html);
    return { enText: enText, arText: arText };
  }

  function inferTagsFromText(meta, enText, arText){
    var text = norm([meta.title, meta.category, meta.section, meta.path, enText, arText].join(' '));
    var tags = [];
    Object.keys(GROUPS).forEach(function(g){
      if(groupTerms(g).some(function(term){ return hasPhrase(text, term); })) tags.push(g);
    });
    return tags.slice(0, 10);
  }

  function getAllTopicsPrecision(){
    if(topicCache) return topicCache;
    var topics = [];
    if(typeof paneContent === 'undefined') return topics;
    Object.keys(paneContent).forEach(function(id){
      var meta = getButtonMeta(id);
      var lang = extractLangText(paneContent[id]);
      // v6 performance: cap cached topic text; full HTML stays in paneContent and on-demand lexicon can still read selected topics.
      lang.enText = String(lang.enText || '').slice(0, 4000);
      lang.arText = String(lang.arText || '').slice(0, 4000);
      var combined = [id, meta.title, meta.category, meta.section, meta.path, lang.enText, lang.arText].join('\n');
      var titleNorm = norm([id.replace(/-/g,' '), meta.title].join(' '));
      var pathNorm = norm([meta.library, meta.category, meta.section].join(' '));
      var bodyNorm = norm([lang.enText, lang.arText].join(' '));
      topics.push({
        id: id,
        title: meta.title,
        label: meta.title || id.replace(/-/g,' '),
        category: meta.category,
        section: meta.section,
        library: meta.library,
        path: meta.path,
        enText: lang.enText,
        arText: lang.arText,
        allText: norm(combined),
        titleNorm: titleNorm,
        pathNorm: pathNorm,
        bodyNorm: bodyNorm,
        tags: inferTagsFromText(meta, lang.enText, lang.arText)
      });
    });
    topicCache = topics;
    return topicCache;
  }

  function coverage(queryOriginal, topic){
    if(!queryOriginal.length) return 0;
    var hay = [topic.titleNorm, topic.pathNorm, topic.bodyNorm].join(' ');
    var hit = 0;
    queryOriginal.forEach(function(t){ if(hasPhrase(hay, t)) hit++; });
    return hit / queryOriginal.length;
  }

  function categoryPenalty(qGroups, topic, primaryTopicIds, wantsUnban){
    var id = String(topic.id || '').toLowerCase();
    var text = topic.allText || '';
    var penalty = 0;
    function topicHasAny(groups){ return groups.some(function(g){ return (topic.tags || []).indexOf(g) >= 0 || groupTerms(g).some(function(term){ return hasPhrase(text, term); }); }); }
    if(qGroups.indexOf('password') >= 0 && !topicHasAny(['password','login','phone','sms','binding'])) penalty += 18;
    if(qGroups.indexOf('recharge') >= 0 && !topicHasAny(['recharge','refund'])) penalty += 16;
    if(qGroups.indexOf('withdrawal') >= 0 && !topicHasAny(['withdrawal'])) penalty += 16;
    if(qGroups.indexOf('agency') >= 0 && !topicHasAny(['agency','host'])) penalty += 10;
    if(qGroups.indexOf('ban') >= 0 && !wantsUnban && /unban|appeal|request-unban|rejected-unban|refund/.test(id) && primaryTopicIds.indexOf(id) < 0) penalty += 32;
    if(qGroups.indexOf('unban') < 0 && /unban|appeal|request-unban|rejected-unban/.test(id) && primaryTopicIds.indexOf(id) < 0 && qGroups.indexOf('ban') >= 0) penalty += 24;
    if(/overview|general|placeholder|alternative|optimized/.test(id) && primaryTopicIds.indexOf(id) < 0) penalty += 8;
    return penalty;
  }

  function existingRoutes(query){
    try{
      if(typeof detectSugoAccuracyRoutes === 'function') return detectSugoAccuracyRoutes(query) || [];
    }catch(e){}
    return [];
  }

  function scoreTopic(topic, queryInfo, options, routes, selectedPaneId){
    var score = 0;
    var hits = [];
    var reasons = [];
    var id = String(topic.id || '');
    var q = queryInfo.raw;
    var words = queryInfo.expanded;
    var original = queryInfo.original;
    var groups = queryInfo.groups;
    var title = topic.titleNorm || '';
    var path = topic.pathNorm || '';
    var body = topic.bodyNorm || '';
    var hay = [title, path, body].join(' ');
    var selected = selectedPaneId && id === selectedPaneId;
    var primary = false;
    var preferTicket = !!(options && (options.preferTicketTopics || options.outputType === 'ticket' || options.smartTicket));
    var primaryTopicIds = [];
    routes.forEach(function(route, idx){
      var ids = [].concat(route.ticketTopicIds || [], route.topicIds || [], route.topicIdsFromRule || []);
      ids.forEach(function(x){ if(primaryTopicIds.indexOf(x) < 0) primaryTopicIds.push(x); });
      var ticketHit = (route.ticketTopicIds || []).indexOf(id) >= 0;
      var topicHit = (route.topicIds || []).indexOf(id) >= 0;
      if(ticketHit || topicHit){
        primary = idx === 0 || primary;
        var base = idx === 0 ? 170 : 90;
        score += ticketHit ? base + (preferTicket ? 75 : 25) : base;
        hits.push(route.name || 'route');
        reasons.push('exact-route');
      }
    });

    if(selected){ score += 220; hits.push('selected-option'); reasons.push('selected'); }
    if(preferTicket){
      if(id.indexOf('sv-tickets-') === 0) score += 24;
      else if(id.indexOf('sv-clean-') === 0 || id.indexOf('sv-refined-') === 0) score += 8;
      else if(/optimized/.test(id)) score -= 10;
    }

    if(q && q.length >= 4){
      if(hasPhrase(title, q)){ score += 72; hits.push(q); reasons.push('title-phrase'); }
      else if(hasPhrase(path, q)){ score += 42; hits.push(q); reasons.push('path-phrase'); }
      else if(hasPhrase(body, q)){ score += 18; hits.push(q); reasons.push('body-phrase'); }
    }

    groups.forEach(function(g){
      var gHitTitle = groupTerms(g).some(function(term){ return hasPhrase(title, term); });
      var gHitPath = groupTerms(g).some(function(term){ return hasPhrase(path, term); });
      var gHitBody = groupTerms(g).some(function(term){ return hasPhrase(body, term); });
      if(gHitTitle || gHitPath || gHitBody){
        var add = GROUP_WEIGHTS[g] || 16;
        if(gHitTitle) add += 12;
        if(gHitPath) add += 7;
        if(gHitBody) add += 2;
        score += add;
        hits.push(g);
        reasons.push('intent-' + g);
      }
    });

    words.forEach(function(w){
      if(!w || w.length < 2 || STOP.has(w)) return;
      if(hasPhrase(title, w)){ score += 16; hits.push(w); }
      else if(title.indexOf(w) >= 0){ score += 10; hits.push(w); }
      if(hasPhrase(path, w)){ score += 8; hits.push(w); }
      else if(path.indexOf(w) >= 0){ score += 5; hits.push(w); }
      if(hasPhrase(body, w)){ score += 2.4; hits.push(w); }
      else if(w.length >= 4 && body.indexOf(w) >= 0){ score += 1.1; hits.push(w); }
      if(w.length >= 5){
        var stem = w.replace(/(ات|ين|ون|ه|ها|هم|ing|ed|s)$/,'');
        if(stem.length >= 4 && hay.indexOf(stem) >= 0) score += 0.8;
      }
    });

    original.forEach(function(w){
      if(hasPhrase(title, w)) score += 5;
      else if(hasPhrase(path, w)) score += 2.5;
    });

    var cov = coverage(original, topic);
    if(cov >= 0.8) score += 12;
    else if(cov >= 0.55) score += 7;
    else if(original.length >= 3 && cov < 0.34 && !primary && !selected) score -= 10;

    var wantsUnban = groups.indexOf('unban') >= 0;
    score -= categoryPenalty(groups, topic, primaryTopicIds, wantsUnban);
    score = Math.max(0, score);

    return Object.assign({}, topic, {
      score: score,
      hits: Array.from(new Set(hits)).slice(0, 14),
      reasons: Array.from(new Set(reasons)).slice(0, 10),
      coverage: Math.round(cov * 100) / 100,
      primary: primary,
      selected: !!selected
    });
  }

  function precisionRank(query, options){
    options = options || {};
    var topics = getAllTopicsPrecision();
    var info = expandQuery(query);
    var selectedPaneId = String(options.preferredPaneId || '').trim();
    var routes = existingRoutes(query);
    var ranked = topics.map(function(t){ return scoreTopic(t, info, options, routes, selectedPaneId); })
      .filter(function(t){ return t.score > 0; })
      .sort(function(a,b){
        if(b.score !== a.score) return b.score - a.score;
        if(a.primary !== b.primary) return a.primary ? -1 : 1;
        if(a.selected !== b.selected) return a.selected ? -1 : 1;
        if((a.title || '').length !== (b.title || '').length) return (a.title || '').length - (b.title || '').length;
        return String(a.id).localeCompare(String(b.id));
      });
    return { info: info, routes: routes, ranked: ranked };
  }

  function confidenceFor(ranked, info, selectedPaneId, primaryRoute){
    var best = ranked[0] || null;
    var second = ranked[1] || null;
    if(!best) return { confidence:'low', label:'Low', score:0, gap:0, ambiguous:false, reason:'no-match' };
    var score = best.score || 0;
    var gap = second ? score - (second.score || 0) : score;
    var ambiguous = !!(second && gap <= Math.max(8, score * 0.12) && score >= 28 && !selectedPaneId && !primaryRoute);
    var confidence = 'low';
    if(selectedPaneId || best.primary || primaryRoute) confidence = ambiguous ? 'medium' : 'high';
    else if(score >= 58 && best.coverage >= 0.45 && !ambiguous) confidence = 'high';
    else if(score >= 24 && best.coverage >= 0.25) confidence = ambiguous ? 'low' : 'medium';
    else if(score >= 15 && info.groups.length) confidence = 'medium';
    var label = confidence === 'high' ? 'High' : confidence === 'medium' ? 'Medium' : 'Low';
    return { confidence:confidence, label:label, score:Math.round(score*10)/10, gap:Math.round(gap*10)/10, ambiguous:ambiguous, reason:ambiguous?'close-results':'' };
  }

  function clip(text, limit){
    if(typeof smartTruncate === 'function') return smartTruncate(text || '', limit);
    text = String(text || '');
    return text.length > limit ? text.slice(0, limit).replace(/\s+\S*$/, '') + ' …' : text;
  }

  function getRelevantKnowledgeBaseTextPrecision(query, maxTopics, maxCharsPerTopic, preferredPaneId, options){
    maxTopics = maxTopics || 8;
    maxCharsPerTopic = maxCharsPerTopic || 1400;
    options = options || {};
    options.preferredPaneId = preferredPaneId || options.preferredPaneId || null;
    var rank = precisionRank(query, options);
    var routes = rank.routes || [];
    var primaryRoute = routes[0] || null;
    var primaryIds = [];
    if(primaryRoute){
      primaryIds = Array.from(new Set([].concat(primaryRoute.ticketTopicIds || [], primaryRoute.topicIds || [])));
    }
    var top = rank.ranked.slice(0, maxTopics);
    // Force exact route topics into the packet even if a broader article has a higher lexical score.
    if(primaryIds.length){
      var forced = primaryIds.map(function(id){ return rank.ranked.find(function(t){ return t.id === id; }); }).filter(Boolean);
      forced.forEach(function(t){ t.primary = true; if(t.hits.indexOf('primary-route') < 0) t.hits.unshift('primary-route'); });
      top = forced.concat(top.filter(function(t){ return !forced.some(function(f){ return f.id === t.id; }); })).slice(0, maxTopics);
    }
    var conf = confidenceFor(top, rank.info, options.preferredPaneId, primaryRoute);
    top = top.map(function(t){ return Object.assign({}, t, { confidence: conf.confidence }); });
    var auditRows = top.slice(0, 5).map(function(t, i){
      return (i+1) + '. ' + t.id + ' | title: ' + (t.title || t.label || '') + ' | score: ' + (Math.round((t.score||0)*10)/10) + ' | path: ' + (t.path || '') + ' | hits: ' + (t.hits || []).slice(0,8).join(', ');
    }).join('\n');
    var routeLine = primaryRoute ? ('Primary route: ' + primaryRoute.name + '\nPrimary topic IDs: ' + primaryIds.join(', ') + '\nRouting instruction: use Primary route topics first; do not replace them with broad overview/unban/generic articles unless the user explicitly asks for that broader topic.') : 'Primary route: none';
    var ambiguityLine = conf.ambiguous ? '\nAmbiguity warning: top results are close; answer cautiously and ask for clarification if the exact case is not explicit.' : '';
    var text = routeLine + ambiguityLine + '\nQuery intents: ' + (rank.info.groups.join(', ') || 'none') + '\nMatch audit:\n' + (auditRows || 'No local match') + '\n\n' + top.map(function(t, index){
      var isPriority = t.primary || t.selected || index === 0;
      var enLimit = isPriority ? Math.max(maxCharsPerTopic, 6600) : maxCharsPerTopic;
      var arLimit = isPriority ? Math.max(Math.floor(maxCharsPerTopic * 0.92), 5800) : Math.floor(maxCharsPerTopic * 0.85);
      var tags = t.tags && t.tags.length ? '\nTags: ' + t.tags.join(', ') : '';
      var meta = [
        '### Topic: ' + t.id,
        'Title: ' + (t.title || t.label || t.id),
        'Path: ' + (t.path || ''),
        'Match score: ' + (Math.round((t.score||0)*10)/10),
        'Coverage: ' + t.coverage,
        t.primary ? 'Primary route match: yes' : 'Primary route match: no',
        t.selected ? 'Selected by user: yes' : 'Selected by user: no',
        tags ? tags.trim() : ''
      ].filter(Boolean).join('\n');
      return meta + '\nEnglish SOP:\n' + clip(t.enText || '', enLimit) + '\n\nArabic SOP:\n' + clip(t.arText || '', arLimit);
    }).join('\n\n');
    return {
      text: text,
      topicIds: top.map(function(t){ return t.id; }),
      topics: top,
      bestTopic: top[0] || null,
      primaryRoute: primaryRoute,
      primaryTopicIds: primaryIds,
      confidence: conf.confidence,
      confidenceLabel: conf.label,
      confidenceScore: conf.score,
      confidenceGap: conf.gap,
      ambiguous: conf.ambiguous,
      queryIntents: rank.info.groups,
      hasMeaningfulMatch: top.length > 0 && (conf.score >= 12 || !!primaryRoute || !!options.preferredPaneId)
    };
  }

  function showPrecisionNavigation(query){
    var q = String(query || '').trim();
    var nr = document.getElementById('noResults');
    if(!q){
      document.querySelectorAll('.nav-l0,.nav-l00,.nav-l000-btn').forEach(function(el){ el.classList.remove('hidden-search'); });
      if(nr) nr.style.display = 'none';
      return;
    }
    var ranked = precisionRank(q, {}).ranked;
    var ids = new Set(ranked.filter(function(t){ return t.score >= 12; }).slice(0, 60).map(function(t){ return t.id; }));
    if(!ids.size){
      ids = new Set(ranked.slice(0, 20).map(function(t){ return t.id; }));
    }
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
      var child = sec.querySelector(':scope > .nav-l00-children');
      var chev = sec.querySelector(':scope > .nav-l00-btn .nav-l00-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    document.querySelectorAll('.nav-l0').forEach(function(cat){
      var vis = Array.prototype.some.call(cat.querySelectorAll('.nav-l00'), function(s){ return !s.classList.contains('hidden-search'); });
      cat.classList.toggle('hidden-search', !vis);
      var child = cat.querySelector(':scope > .nav-l0-children');
      var chev = cat.querySelector(':scope > .nav-l0-btn .nav-l0-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    document.querySelectorAll('.nav-lroot').forEach(function(root){
      var vis = Array.prototype.some.call(root.querySelectorAll('.nav-l000-btn[data-pane]'), function(b){ return !b.classList.contains('hidden-search'); });
      var child = root.querySelector(':scope > .nav-lroot-children');
      var chev = root.querySelector(':scope > .nav-lroot-btn .nav-lroot-chev');
      if(vis){ if(child) child.classList.add('open'); if(chev) chev.classList.add('open'); }
    });
    if(nr) nr.style.display = any ? 'none' : 'block';
  }

  function esc(value){
    if(typeof escapeHtml === 'function') return escapeHtml(value);
    return String(value || '').replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; });
  }

  function renderPrecisionBest(query){
    var panel = document.getElementById('v51BestMatchPanel');
    if(!panel) return;
    var q = String(query || '').trim();
    if(!q){ panel.style.display = 'none'; panel.innerHTML = ''; return; }
    var kb = getRelevantKnowledgeBaseTextPrecision(q, 4, 900, null, { outputType: (typeof getOutputType === 'function' ? getOutputType() : 'answer') });
    if(!kb.topicIds.length){ panel.style.display='none'; panel.innerHTML=''; return; }
    var cls = kb.confidence === 'high' ? 'ai-source-high' : kb.confidence === 'medium' ? 'ai-source-medium' : 'ai-source-low';
    var rows = (kb.topics || []).slice(0,3).map(function(t, i){
      return '<div style="padding:8px 0;border-top:' + (i ? '1px solid rgba(148,163,184,.18)' : '0') + '">' +
        '<div class="v51-best-title" style="margin-bottom:2px;">' + esc((i+1) + '. ' + (t.title || t.label || t.id)) + '</div>' +
        '<div class="v51-best-section">' + esc((t.path || t.section || '') + ' · score ' + (Math.round((t.score||0)*10)/10) + (t.hits && t.hits.length ? ' · ' + t.hits.slice(0,4).join(', ') : '')) + '</div>' +
        '<div class="v51-best-actions"><button type="button" class="v51-mini-btn" data-sugo-precision-open="' + esc(t.id) + '">Open SOP</button><button type="button" class="v51-mini-btn" data-sugo-precision-ask="' + esc(t.title || t.label || t.id) + '" data-sugo-precision-pane="' + esc(t.id) + '">Ask AI</button></div>' +
      '</div>';
    }).join('');
    panel.style.display = 'block';
    panel.innerHTML = '<div class="v51-best-card sugo-precision-best-match">' +
      '<div class="v51-best-top"><span class="v51-best-badge">Precision Match</span><span class="v51-best-score ' + cls + '">' + esc(kb.confidenceLabel + ' · ' + kb.confidenceScore) + '</span></div>' +
      (kb.ambiguous ? '<div class="v51-best-section" style="color:#92400e;font-weight:850;">⚠ Close matches — verify the case before sending.</div>' : '') +
      rows +
      '</div>';
  }

  function precisionDoSearch(query){
    showPrecisionNavigation(query);
    renderPrecisionBest(query);
  }

  function invalidate(){ topicCache = null; }

  function install(){
    try{
      window.getAllTopics = getAllTopicsPrecision;
      getAllTopics = getAllTopicsPrecision;
    }catch(e){}
    try{
      window.getRelevantKnowledgeBaseText = getRelevantKnowledgeBaseTextPrecision;
      getRelevantKnowledgeBaseText = getRelevantKnowledgeBaseTextPrecision;
    }catch(e){}
    try{
      window.doSearch = precisionDoSearch;
      doSearch = precisionDoSearch;
    }catch(e){}
    try{
      if(window.SugoApp && window.SugoApp.navigation) window.SugoApp.navigation.search = precisionDoSearch;
    }catch(e){}
    document.addEventListener('click', function(e){
      var open = e.target.closest && e.target.closest('[data-sugo-precision-open]');
      if(open){
        e.preventDefault();
        var paneId = open.getAttribute('data-sugo-precision-open');
        if(paneId && typeof showPane === 'function') showPane(paneId, true);
        return;
      }
      var ask = e.target.closest && e.target.closest('[data-sugo-precision-ask]');
      if(ask){
        e.preventDefault();
        var q = ask.getAttribute('data-sugo-precision-ask') || '';
        var pane = ask.getAttribute('data-sugo-precision-pane') || '';
        if(pane){ window.SUGO_EXACT_AI_PANE = pane; window.SUGO_ACTIVE_PANE = pane; window.SUGO_ACTIVE_PANE_TS = Date.now(); }
        var input = document.getElementById('searchInput');
        if(input) input.value = q;
        if(typeof askAI === 'function') askAI(q);
      }
    }, true);
    setTimeout(invalidate, 250);
    setTimeout(invalidate, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  window.addEventListener('load', function(){ invalidate(); install(); });

  window.SUGO_PRECISION_SEARCH = {
    version: PRECISION_VERSION,
    normalize: norm,
    groups: GROUPS,
    expandQuery: expandQuery,
    rank: precisionRank,
    invalidate: invalidate,
    getTopics: getAllTopicsPrecision
  };
})();
