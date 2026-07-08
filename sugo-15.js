(function(){
  function hide(){
    try{
      var splash=document.getElementById('sugoOpeningSplash');
      if(splash){ splash.classList.add('sugo-hide'); setTimeout(function(){ try{splash.remove();}catch(e){} },500); }
      document.documentElement.classList.remove('sugo-booting');
      if(document.body) document.body.style.overflow='';
    }catch(e){}
  }
  setTimeout(hide, 3500);
  window.addEventListener('error', function(){ setTimeout(hide, 100); });
})();
