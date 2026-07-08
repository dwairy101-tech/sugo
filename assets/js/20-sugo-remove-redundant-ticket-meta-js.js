(function(){
  function clearRedundantTicketMeta(){
    var ids = ['aiTicketBuilderPanel','sugoTicketSide','aiAuditPanel','aiSources'];
    ids.forEach(function(id){
      var el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = '';
      el.setAttribute('hidden','hidden');
      el.classList.remove('active','has-items');
      el.style.display = 'none';
    });
  }
  function disabledRenderer(){
    clearRedundantTicketMeta();
  }
  try {
    window.renderAISources = disabledRenderer;
    window.renderAIAnswerAudit = disabledRenderer;
    window.renderSmartTicketBuilder = disabledRenderer;
  } catch (e) {}
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', clearRedundantTicketMeta);
  } else {
    clearRedundantTicketMeta();
  }
  // v6 performance: do not watch the full document for every topic DOM insertion.
  // The metadata panels are cleared once and the renderers above are disabled.
})();
