/* Lazy-loaded SUGO pane: game-greedy-dice */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-greedy-dice'); return; }
  setPane('game-greedy-dice', createDualContent(
  "Greedy Dice\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Greedy Dice\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
