// SUGO progressive loader v3 — feature-triggered heavy loading only.
(function(){
  if (window.SUGO_PROGRESSIVE_LOADER_V2) return;
  window.SUGO_PROGRESSIVE_LOADER_V2 = true;

  var loaded = Object.create(null);
  var loading = Object.create(null);
  var base = (function(){
    var current = document.currentScript;
    if (current && current.src) return current.src.replace(/\/[^\/]*$/, '/') ;
    return 'assets/js/';
  })();

  function loadScript(file){
    return new Promise(function(resolve, reject){
      var src = base + file;
      var exists = document.querySelector('script[src="' + src.replace(/"/g, '\\"') + '"]');
      if (exists) return resolve();
      var s = document.createElement('script');
      s.src = src;
      s.defer = true;
      s.onload = function(){ resolve(); };
      s.onerror = function(){ reject(new Error('Failed to load ' + file)); };
      document.head.appendChild(s);
    });
  }

  function loadPhase(name){
    if (loaded[name]) return Promise.resolve();
    if (loading[name]) return loading[name];
    var files = [];
    if (name === 'phase2') files = ['sugo.idle.phase2.js'];
    if (name === 'phase3') files = ['sugo.idle.phase2.js', 'sugo.optional.phase3.js'];
    loading[name] = files.reduce(function(p, file){
      return p.then(function(){ return loadScript(file); });
    }, Promise.resolve()).then(function(){ loaded[name] = true; }).catch(function(err){
      console.warn('[SUGO loader]', err && err.message ? err.message : err);
    });
    return loading[name];
  }

  window.SugoLoadPhase = loadPhase;

  function whenReady(fn){
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once:true });
    else fn();
  }

  whenReady(function(){
    // v3: absolutely no generic interaction autoload. Heavy files are loaded only
    // when the user opens AI/advanced/admin/favorite features that need them.
    document.addEventListener('pointerdown', function(ev){
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('.ask-ai-btn, #createTicketBtn, [data-v51-search], [data-v52-search], .sugo-vision-upload, .sugo-vision-upload-btn')) {
        loadPhase('phase2');
      }
      if (t.closest('[data-sugo-edit-section], [data-sugo-tiny-plus], [data-sugo-fr-open], [data-sugo-fav-toggle], .admin-edit-button, .edit-section-btn')) {
        loadPhase('phase3');
      }
    }, true);
    document.addEventListener('keydown', function(ev){
      if(ev.target && ev.target.id === 'searchInput' && ev.key === 'Enter' && !ev.shiftKey){
        loadPhase('phase2');
      }
    }, true);
  });
})();
