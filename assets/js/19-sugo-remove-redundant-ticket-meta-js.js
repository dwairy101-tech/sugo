// Extracted from index(94).html: <script id="sugo-remove-redundant-ticket-meta-js">
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
  try {
    new MutationObserver(clearRedundantTicketMeta).observe(document.documentElement, { childList:true, subtree:true });
  } catch (e) {}
})();
