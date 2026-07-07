/* Lazy-loaded SUGO pane: game-center */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-center'); return; }
  setPane('game-center', createDualContent(
  "Game Center\n\n" +
  "Android:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2\n" +
  "iOS:\n" +
  "   * VIP Level ≥ 3\n" +
  "   * Charm Level ≥ 2",
  "مركز الألعاب (Game Center)\n\n" +
  "Android:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2\n" +
  "iOS:\n" +
  "   * مستوى VIP ≥ 3\n" +
  "   * مستوى الجاذبية ≥ 2"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
