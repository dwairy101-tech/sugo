/* Lazy-loaded SUGO pane: game-slot-game */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-slot-game'); return; }
  setPane('game-slot-game', createDualContent(
  "Slot Game\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Slot Game\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
