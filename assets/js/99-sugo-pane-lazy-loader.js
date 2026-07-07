/* SUGO Split Loader — keeps startup light; loads SOP panes only when needed. */
(function(){
  'use strict';
  var loaded = Object.create(null);
  var loading = Object.create(null);
  var allPanesPromise = null;
  var allLoaded = false;
  var indexedTopicsCache = null;

  function manifest(){ return window.SUGO_PANE_MANIFEST || {}; }
  function hasPane(id){ return !!manifest()[id]; }
  function loadScript(src){
    return new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = resolve;
      s.onerror = function(){ reject(new Error('Failed to load '+src)); };
      document.head.appendChild(s);
    });
  }
  function ensurePane(id){
    if(allLoaded) return Promise.resolve();
    if(!id || !hasPane(id) || loaded[id]) return Promise.resolve();
    if(loading[id]) return loading[id];
    loading[id] = loadScript(manifest()[id]).then(function(){ loaded[id] = true; });
    return loading[id];
  }
  function ensureAllPanes(){
    if(allLoaded || window.SUGO_ALL_PANES_BUNDLE_LOADED) { allLoaded = true; return Promise.resolve(); }
    if(allPanesPromise) return allPanesPromise;
    allPanesPromise = loadScript('assets/data/all-panes.bundle.js').then(function(){
      allLoaded = true;
      Object.keys(manifest()).forEach(function(id){ loaded[id] = true; });
      try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
    });
    return allPanesPromise;
  }
  function simpleNorm(value){
    return String(value || '').toLowerCase()
      .replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ة/g,'ه').replace(/ـ/g,'')
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[^\p{L}\p{N}\s]/gu,' ')
      .replace(/\s+/g,' ').trim();
  }
  function enrichOriginalTopics(list){
    var raw = Array.isArray(window.SUGO_TOPIC_INDEX_RAW) ? window.SUGO_TOPIC_INDEX_RAW : [];
    var meta = Object.create(null);
    raw.forEach(function(t){ meta[t.id] = t; });
    return (list || []).map(function(t){
      var m = meta[t.id] || {};
      var all = simpleNorm([t.id, m.title, m.category, m.section, m.path, t.enText, t.arText].join(' '));
      return Object.assign({}, t, {
        title: m.title || t.title || t.id,
        label: m.label || m.title || t.label || t.id,
        category: m.category || t.category || '',
        section: m.section || t.section || '',
        library: m.library || t.library || '',
        path: m.path || t.path || '',
        allText: all,
        titleNorm: simpleNorm([t.id, m.title].join(' ')),
        pathNorm: simpleNorm([m.library, m.category, m.section].join(' ')),
        bodyNorm: simpleNorm([t.enText, t.arText].join(' ')),
        tags: t.tags || []
      });
    });
  }
  function getIndexedTopics(){
    if(allLoaded && typeof window.__SUGO_ORIGINAL_GET_ALL_TOPICS === 'function') {
      return enrichOriginalTopics(window.__SUGO_ORIGINAL_GET_ALL_TOPICS());
    }
    if(indexedTopicsCache) return indexedTopicsCache;
    var raw = Array.isArray(window.SUGO_TOPIC_INDEX_RAW) ? window.SUGO_TOPIC_INDEX_RAW : [];
    indexedTopicsCache = raw.map(function(t){
      var all = simpleNorm([t.id, t.title, t.category, t.section, t.path, t.text].join(' '));
      return {
        id:t.id, title:t.title || t.id, label:t.label || t.title || t.id,
        category:t.category || '', section:t.section || '', library:t.library || '', path:t.path || '',
        enText:t.text || '', arText:'', allText:all, titleNorm:simpleNorm([t.id,t.title].join(' ')),
        pathNorm:simpleNorm([t.library,t.category,t.section].join(' ')), bodyNorm:simpleNorm(t.text || ''), tags:[]
      };
    });
    return indexedTopicsCache;
  }
  function showLoading(){ try{ var input=document.getElementById('searchInput'); if(input) input.setAttribute('aria-busy','true'); }catch(e){} }
  function hideLoading(){ try{ var input=document.getElementById('searchInput'); if(input) input.removeAttribute('aria-busy'); }catch(e){} }
  function install(){
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
