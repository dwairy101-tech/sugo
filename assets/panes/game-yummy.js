/* Lazy-loaded SUGO pane: game-yummy */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-yummy'); return; }
  setPane('game-yummy', createDualContent(
  "Yummy\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Yummy\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
