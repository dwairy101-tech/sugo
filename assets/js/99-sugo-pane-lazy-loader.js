/* SUGO Split Loader v2 — lazy SOP panes + cache-safe AI loading. */
(function(){
  'use strict';
  var loaded = Object.create(null);
  var loading = Object.create(null);
  var allPanesPromise = null;
  var allLoaded = false;
  var indexedTopicsCache = null;

  function manifest(){ return window.SUGO_PANE_MANIFEST || {}; }
  function hasPane(id){ return !!manifest()[id]; }
  function safeEscapeSelector(id){ try { return CSS.escape(id); } catch(e) { return String(id || '').replace(/[^a-zA-Z0-9_-]/g, '\\$&'); } }
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var existing = document.querySelector('script[data-sugo-src="' + src.replace(/"/g, '') + '"]');
      if(existing && existing.dataset.loaded === '1') return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.dataset.sugoSrc = src;
      s.onload = function(){ s.dataset.loaded = '1'; resolve(); };
      s.onerror = function(){ reject(new Error('Failed to load '+src)); };
      document.head.appendChild(s);
    });
  }
  function invalidateCaches(){
    indexedTopicsCache = null;
    try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
    try { if (window.SUGO_PRECISION_SEARCH && typeof window.SUGO_PRECISION_SEARCH.invalidate === 'function') window.SUGO_PRECISION_SEARCH.invalidate(); } catch(e) {}
    try { if (window.SUGO_SPEED_COMPLETE_ANSWER && typeof window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex === 'function') window.SUGO_SPEED_COMPLETE_ANSWER.rebuildIndex(); } catch(e) {}
  }
  function removeRenderedPlaceholder(id){
    try {
      var el = document.getElementById('pane-' + id) || document.querySelector('#pane-' + safeEscapeSelector(id));
      if(el && el.querySelector('[data-sugo-lazy-placeholder="1"]')){
        el.remove();
        try { if (typeof renderedPanes !== 'undefined' && renderedPanes && renderedPanes.delete) renderedPanes.delete(id); } catch(e) {}
      }
    } catch(e) {}
  }
  function ensurePane(id){
    if(allLoaded) return Promise.resolve();
    if(!id || !hasPane(id) || loaded[id]) return Promise.resolve();
    if(loading[id]) return loading[id];
    loading[id] = loadScript(manifest()[id]).then(function(){
      loaded[id] = true;
      removeRenderedPlaceholder(id);
      invalidateCaches();
    }).catch(function(err){ delete loading[id]; throw err; });
    return loading[id];
  }
  function ensureAllPanes(){
    if(allLoaded || window.SUGO_ALL_PANES_BUNDLE_LOADED) { allLoaded = true; invalidateCaches(); return Promise.resolve(); }
    if(allPanesPromise) return allPanesPromise;
    allPanesPromise = loadScript('assets/data/all-panes.bundle.js').then(function(){
      allLoaded = true;
      Object.keys(manifest()).forEach(function(id){ loaded[id] = true; removeRenderedPlaceholder(id); });
      invalidateCaches();
    }).catch(function(err){ allPanesPromise = null; throw err; });
    return allPanesPromise;
  }
  function simpleNorm(value){
    return String(value || '').toLowerCase()
      .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/ـ/g,'')
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[^\p{L}\p{N}\s]/gu,' ')
      .replace(/\s+/g,' ').trim();
  }
  function textFromHtml(html){
    var tmp = document.createElement('div'); tmp.innerHTML = String(html || '');
    return (tmp.textContent || tmp.innerText || '').replace(/\s+/g,' ').trim();
  }
  function metaFor(id){
    var raw = Array.isArray(window.SUGO_TOPIC_INDEX_RAW) ? window.SUGO_TOPIC_INDEX_RAW : [];
    for(var i=0;i<raw.length;i++) if(raw[i] && raw[i].id === id) return raw[i];
    return { id:id, title:String(id||'').replace(/-/g,' '), label:String(id||'').replace(/-/g,' '), category:'', section:'', library:'', path:'' };
  }
  function fullTopicsFromPaneContent(){
    var topics = [];
    try{
      if(typeof paneContent === 'undefined') return topics;
      Object.keys(paneContent).forEach(function(id){
        var row = paneContent[id] || {};
        var meta = metaFor(id);
        var html = row.en || row.html || '';
        var tmp = document.createElement('div'); tmp.innerHTML = String(html || '');
        var dividers = tmp.querySelectorAll('.lang-divider');
        var enText = '', arText = '';
        if(dividers.length >= 1 && dividers[0].nextElementSibling) enText = (dividers[0].nextElementSibling.textContent || '').trim();
        if(dividers.length >= 2 && dividers[1].nextElementSibling) arText = (dividers[1].nextElementSibling.textContent || '').trim();
        if(!enText && !arText) enText = textFromHtml(html);
        var all = simpleNorm([id, meta.title, meta.category, meta.section, meta.path, enText, arText].join(' '));
        topics.push({
          id:id, title:meta.title || id, label:meta.label || meta.title || id,
          category:meta.category || '', section:meta.section || '', library:meta.library || '', path:meta.path || '',
          enText:enText, arText:arText, allText:all,
          titleNorm:simpleNorm([id, meta.title].join(' ')),
          pathNorm:simpleNorm([meta.library, meta.category, meta.section].join(' ')),
          bodyNorm:simpleNorm([enText, arText].join(' ')), tags:[]
        });
      });
    }catch(e){}
    return topics;
  }
  function getIndexedTopics(){
    if(allLoaded || window.SUGO_ALL_PANES_BUNDLE_LOADED) return fullTopicsFromPaneContent();
    if(indexedTopicsCache) return indexedTopicsCache;
    var raw = Array.isArray(window.SUGO_TOPIC_INDEX_RAW) ? window.SUGO_TOPIC_INDEX_RAW : [];
    indexedTopicsCache = raw.map(function(t){
      var all = simpleNorm([t.id, t.title, t.category, t.section, t.path, t.text].join(' '));
      return {
        id:t.id, title:t.title || t.id, label:t.label || t.title || t.id,
        category:t.category || '', section:t.section || '', library:t.library || '', path:t.path || '',
        enText:t.text || '', arText:'', allText:all,
        titleNorm:simpleNorm([t.id,t.title].join(' ')),
        pathNorm:simpleNorm([t.library,t.category,t.section].join(' ')), bodyNorm:simpleNorm(t.text || ''), tags:[]
      };
    });
    return indexedTopicsCache;
  }
  function showLoading(){ try{ var input=document.getElementById('searchInput'); if(input) input.setAttribute('aria-busy','true'); }catch(e){} }
  function hideLoading(){ try{ var input=document.getElementById('searchInput'); if(input) input.removeAttribute('aria-busy'); }catch(e){} }
  function install(){
    try { if (typeof paneContent !== 'undefined') window.paneContent = paneContent; } catch(e) {}
    try { if (typeof setPane === 'function') window.setPane = setPane; } catch(e) {}
    var original = window.showPane || (typeof showPane === 'function' ? showPane : null);
    if(original && !original.__sugoLazyPaneWrapped){
      window.__SUGO_ORIGINAL_SHOW_PANE = original;
      var wrapped = function(paneId, save){
        if(hasPane(paneId) && !loaded[paneId] && !allLoaded){
          showLoading();
          return ensurePane(paneId).then(function(){ hideLoading(); return original.call(window, paneId, save !== false); })
            .catch(function(err){ hideLoading(); console.error(err); });
        }
        return original.call(window, paneId, save !== false);
      };
      wrapped.__sugoLazyPaneWrapped = true;
      window.showPane = wrapped;
      try { showPane = wrapped; } catch(e) {}
    }
    if(!window.__SUGO_ORIGINAL_GET_ALL_TOPICS){
      window.__SUGO_ORIGINAL_GET_ALL_TOPICS = window.getAllTopics || (typeof getAllTopics === 'function' ? getAllTopics : null);
    }
    window.getAllTopics = getIndexedTopics;
    try { getAllTopics = getIndexedTopics; } catch(e) {}

    var originalAsk = window.askAI || (typeof askAI === 'function' ? askAI : null);
    if(originalAsk && !originalAsk.__sugoAllPanesWrapped){
      var askWrapped = function(){
        var args = arguments;
        showLoading();
        return ensureAllPanes().then(function(){ hideLoading(); return originalAsk.apply(window, args); })
          .catch(function(err){ hideLoading(); console.error(err); return originalAsk.apply(window, args); });
      };
      askWrapped.__sugoAllPanesWrapped = true;
      window.askAI = askWrapped;
      try { askAI = askWrapped; } catch(e) {}
    }
  }
  window.SUGOEnsurePaneContent = ensurePane;
  window.SUGOEnsureAllPanesLoaded = ensureAllPanes;
  window.SUGOInstallLazyPanePatches = install;
  install();
  window.addEventListener('load', function(){ setTimeout(install, 0); setTimeout(install, 600); }, { once:true });
})();
