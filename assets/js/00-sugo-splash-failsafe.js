(function(){
  window.addEventListener('load', function(){
    setTimeout(function(){
      var splash = document.getElementById('sugoOpeningSplash');
      if (splash) splash.classList.add('sugo-hide');
      document.documentElement.classList.remove('sugo-booting');
    }, 2500);
  });
})();
