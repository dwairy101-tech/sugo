// Extracted from index(94).html: <script id="sugo-search-performance-hotfix">
(function(){
  'use strict';
  var mainSearchTimer = null;
  var lastValue = '';
  var waitMs = 170;

  function runSearch(value){
    if(typeof window.doSearch === 'function'){
      window.doSearch(value);
    }
  }

  window.sugoFastSearchInput = function(el){
    if(!el) return;
    try{
      if(typeof window.autoResizeSearch === 'function') window.autoResizeSearch(el);
      else { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,160)+'px'; }
    }catch(e){}
    var value = String(el.value || '');
    lastValue = value;
    clearTimeout(mainSearchTimer);
    var trimmed = value.trim();
    mainSearchTimer = setTimeout(function(){
      // Only run the latest requested search. This prevents the UI from freezing while typing quickly.
      runSearch(lastValue);
    }, trimmed ? waitMs : 20);
  };

  window.SUGO_SEARCH_PERFORMANCE = {
    version: '1.1.0',
    debounceMs: waitMs,
    note: 'Main search is debounced and redundant live listeners are disabled.'
  };
})();
