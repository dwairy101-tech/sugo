/* Lazy-loaded SUGO pane: game-texas-cowboy */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-texas-cowboy'); return; }
  setPane('game-texas-cowboy', createDualContent(
  "Texas Cowboy\n\n" +
  "Android:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2\n" +
  "iOS:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2",
  "Texas Cowboy\n\n" +
  "Android:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2\n" +
  "iOS:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
