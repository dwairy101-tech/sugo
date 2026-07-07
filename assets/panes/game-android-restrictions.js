/* Lazy-loaded SUGO pane: game-android-restrictions */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-android-restrictions'); return; }
  setPane('game-android-restrictions', createDualContent(
  "Android Game Restrictions\n\n" +
  "Temporary Game Restriction\n" +
  "All games will be temporarily hidden if:\n\n" +
  "* The user spends 2,000+ coins during the current week, or\n" +
  "* The user spends 2,000+ coins during the previous week.\n\n" +
  "Permanent Game Restriction\n" +
  "All games will be permanently hidden if:\n\n" +
  "* The user's total non-game consumption reaches 40,000+ coins.",
  "قيود الألعاب على Android\n\n" +
  "تقييد مؤقت للألعاب\n" +
  "سيتم إخفاء جميع الألعاب مؤقتًا إذا:\n\n" +
  "* أنفق المستخدم 2000+ عملة خلال الأسبوع الحالي، أو\n" +
  "* أنفق المستخدم 2000+ عملة خلال الأسبوع الماضي.\n\n" +
  "تقييد دائم للألعاب\n" +
  "سيتم إخفاء جميع الألعاب بشكل دائم إذا:\n\n" +
  "* إجمالي استهلاك المستخدم خارج الألعاب يصل إلى 40000+ عملة."
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
