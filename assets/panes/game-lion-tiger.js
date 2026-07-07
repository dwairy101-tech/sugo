/* Lazy-loaded SUGO pane: game-lion-tiger */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-lion-tiger'); return; }
  setPane('game-lion-tiger', createDualContent(
  "Lion or Tiger\n\n" +
  "* VIP Level ≥ 5\n" +
  "* Charm Level ≥ 4",
  "Lion or Tiger\n\n" +
  "* مستوى VIP ≥ 5\n" +
  "* مستوى الجاذبية ≥ 4"
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
