/* Lazy-loaded SUGO pane: game-blacklist */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-blacklist'); return; }
  setPane('game-blacklist', createDualContent(
  "Game Blacklist\n\n" +
  "* Users included in the Game Blacklist cannot view or access any games regardless of their VIP Level or Charm Level.",
  "القائمة السوداء للألعاب\n\n" +
  "* المستخدمون المدرجون في القائمة السوداء للألعاب لا يمكنهم رؤية أو الوصول إلى أي ألعاب بغض النظر عن مستوى VIP أو مستوى الجاذبية الخاص بهم."
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
