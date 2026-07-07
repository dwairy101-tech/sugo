/* Lazy-loaded SUGO pane: game-roulette */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-roulette'); return; }
  setPane('game-roulette', createDualContent(
  "Roulette\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Roulette\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
