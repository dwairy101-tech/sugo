/* Lazy-loaded SUGO pane: game-ludo */
(function(){
  if (typeof setPane !== 'function') { console.error('SUGO setPane is not ready for pane: game-ludo'); return; }
  setPane('game-ludo', createDualContent(
  "Ludo – Play with Coins\n\n" +
  "Requirements\n\n" +
  "* VIP Level ≥ 5 or\n" +
  "* Charm Level ≥ 4\n\n" +
  "Additional Conditions\n\n" +
  "1. Users who do not meet the requirements cannot see the Play with Coins option.\n" +
  "2. Users who meet the requirements can see the option.\n" +
  "3. To start a coin game, the user's Ludo Level must be ≥ 5.",
  "Ludo – اللعب بالعملات\n\n" +
  "المتطلبات\n\n" +
  "* مستوى VIP ≥ 5 أو\n" +
  "* مستوى الجاذبية ≥ 4\n\n" +
  "شروط إضافية\n\n" +
  "1. المستخدمون الذين لا يستوفون المتطلبات لا يمكنهم رؤية خيار اللعب بالعملات.\n" +
  "2. المستخدمون الذين يستوفون المتطلبات يمكنهم رؤية الخيار.\n" +
  "3. لبدء لعبة بالعملات، يجب أن يكون مستوى Ludo للمستخدم ≥ 5."
));
  try { if (typeof sugoTopicsCache !== 'undefined') sugoTopicsCache = null; } catch(e) {}
})();
