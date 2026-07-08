(function(){
  function lockOldOptionsUI(){
    var sidebar = document.getElementById('sidebar');
    if(sidebar) sidebar.classList.remove('options-open');

    var btn = document.getElementById('optionsToggleBtn');
    if(btn){
      btn.hidden = true;
      btn.setAttribute('aria-hidden','true');
      btn.setAttribute('tabindex','-1');
    }

    var deck = document.querySelector('#sidebar .control-deck');
    if(deck){
      deck.hidden = true;
      deck.setAttribute('aria-hidden','true');
    }
  }

  window.toggleSugoOptions = function(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
    }
    lockOldOptionsUI();
    return false;
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', lockOldOptionsUI);
  }else{
    lockOldOptionsUI();
  }
  window.addEventListener('load', lockOldOptionsUI);
  setTimeout(lockOldOptionsUI, 250);
  setTimeout(lockOldOptionsUI, 900);
})();
