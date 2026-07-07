/* Lazy-loaded SUGO pane: game-rocket-crash */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-rocket-crash'); return; }
  setPane('game-rocket-crash', createDualContent(
  "Rocket Crash\n\n" +
  "Android:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2\n" +
  "iOS:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2",
  "Rocket Crash\n\n" +
  "Android:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2\n" +
  "iOS:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
