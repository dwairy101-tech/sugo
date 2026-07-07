(function(){
  'use strict';
  if(window.__SUGO_STABLE_OPTIONS_SEARCH_FINAL_FIX__) return;
  window.__SUGO_STABLE_OPTIONS_SEARCH_FINAL_FIX__ = true;

  function byId(id){ return document.getElementById(id); }
  function setOptionsOpen(open){
    var sidebar = byId('sidebar');
    var btn = byId('optionsToggleBtn');
    if(sidebar) sidebar.classList.toggle('options-open', !!open);
    if(btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    try{ localStorage.setItem('sugo_options_open', open ? '1' : '0'); }catch(e){}
  }

  window.toggleSugoOptions = function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var sidebar = byId('sidebar');
    var next = !(sidebar && sidebar.classList.contains('options-open'));
    setOptionsOpen(next);
    if(typeof window.updateSugoOptionsSummary === 'function') window.updateSugoOptionsSummary();
    setTimeout(function(){ setOptionsOpen(next); }, 40);
    setTimeout(function(){ setOptionsOpen(next); }, 220);
    return false;
  };

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('#optionsToggleBtn');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      window.toggleSugoOptions(e);
    }
  }, true);

  var lastSearch = '';
  function rememberSearch(){
    var input = byId('searchInput');
    if(input) lastSearch = input.value || '';
  }
  function restoreSearchIfNeeded(){
    var input = byId('searchInput');
    if(!input || !lastSearch) return;
    if(!input.value){
      input.value = lastSearch;
      if(typeof window.sugoFastSearchInput === 'function') window.sugoFastSearchInput(input);
      else if(typeof window.doSearch === 'function') window.doSearch(lastSearch);
    }
  }
  document.addEventListener('input', function(e){ if(e.target && e.target.id === 'searchInput') rememberSearch(); }, true);
  document.addEventListener('focusin', function(e){ if(e.target && e.target.id === 'searchInput') rememberSearch(); }, true);
  window.addEventListener('load', function(){
    setTimeout(restoreSearchIfNeeded, 250);
    setTimeout(restoreSearchIfNeeded, 900);
    setTimeout(restoreSearchIfNeeded, 1700);
  });
})();
