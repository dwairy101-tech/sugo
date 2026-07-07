/* Lazy-loaded SUGO pane: game-permanent-restriction */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-permanent-restriction'); return; }
  setPane('game-permanent-restriction', createDualContent(
  "Permanent Game Restriction\n\n" +
  "All games will be permanently hidden if:\n\n" +
  "* The user's total non-game consumption reaches 40,000+ coins.",
  "التقييد الدائم للألعاب\n\n" +
  "سيتم إخفاء جميع الألعاب بشكل دائم إذا:\n\n" +
  "* إجمالي استهلاك المستخدم خارج الألعاب يصل إلى 40000+ عملة."
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
