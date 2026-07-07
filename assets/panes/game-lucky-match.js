/* Lazy-loaded SUGO pane: game-lucky-match */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-lucky-match'); return; }
  setPane('game-lucky-match', createDualContent(
  "Lucky Match\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Lucky Match\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
