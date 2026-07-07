/* SUGO Phase 3 SW registration — silent and safe on GitHub Pages/HTTPS. */
(function(){
  if(!('serviceWorker' in navigator)) return;
  var okProtocol = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if(!okProtocol) return;
  window.addEventListener('load', function(){
    setTimeout(function(){
      navigator.serviceWorker.register('./sugo-sw.js', { scope: './' }).catch(function(err){
        console.warn('[SUGO SW]', err && err.message ? err.message : err);
      });
    }, 1200);
  }, { once:true });
})();
