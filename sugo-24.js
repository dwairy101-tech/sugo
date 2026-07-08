(function(){
  var askState = {
    language: 'english',
    response: 'brief',
    sop: 'hybrid',
    focus: 'agent'
  };

  function byId(id){ return document.getElementById(id); }
  function currentSearchText(){ return (byId('searchInput') && byId('searchInput').value || '').trim(); }

  function setHiddenSelect(id, value){
    var el = byId(id);
    if(!el) return;
    if(Array.from(el.options || []).some(function(opt){ return opt.value === value; })){
      el.value = value;
      try{ el.dispatchEvent(new Event('change', { bubbles:true })); }catch(e){}
    }
  }

  function applyAskStateToLegacyControls(){
    setHiddenSelect('languageSelect', askState.language);
    setHiddenSelect('outputTypeSelect', 'answer');
    setHiddenSelect('sopModeSelect', askState.sop);
    setHiddenSelect('responseModeSelect', askState.response);
    if(typeof window.setResponseMode === 'function'){
      try{ window.setResponseMode(askState.response); }catch(e){}
    }
  }

  function focusInstruction(){
    if(askState.focus === 'sop_check'){
      return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing SOP check. Start with the best matching policy/procedure, mention confidence when useful, separate what is confirmed by SOP from what needs verification, and avoid writing a customer ticket.';
    }
    if(askState.focus === 'troubleshoot'){
      return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing troubleshooting answer. Provide practical steps in the correct order, include what evidence to request, and mention when to escalate. Do not write a customer ticket.';
    }
    if(askState.focus === 'escalation'){
      return 'This request came from the dedicated Ask AI workspace. Treat it as an escalation review. Identify whether escalation is needed, which team/path should handle it if known, what missing information/evidence is required, and what the agent should avoid promising. Do not write a customer ticket.';
    }
    return 'This request came from the dedicated Ask AI workspace. Treat it as an agent-facing support answer. Give the correct action, relevant SOP conditions, missing information, and safe customer guidance. Do not write a customer ticket unless the user specifically asks inside the question.';
  }

  function hideWorkspaceOnly(){
    var panel = byId('sugoAskAIWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage2-ask-open');
  }

  function openWorkspace(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var panel = byId('sugoAskAIWorkspace');
    if(!panel){
      if(typeof window.askAI === 'function') window.askAI(currentSearchText());
      return false;
    }
    var input = byId('sugoAskAIInput');
    var source = currentSearchText();
    if(input && source && !input.value.trim()) input.value = source;

    try{
      document.querySelectorAll('.content-pane.active').forEach(function(el){ el.classList.remove('active'); });
    }catch(e){}
    var aiPane = byId('aiAnswerPane');
    if(aiPane) aiPane.classList.remove('active');
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    var breadcrumb = byId('sugoBreadcrumb');
    if(breadcrumb) breadcrumb.innerHTML = '';

    panel.hidden = false;
    panel.classList.add('active');
    var area = byId('contentArea');
    if(area) area.classList.add('sugo-stage2-ask-open');
    syncButtons();
    setTimeout(function(){ if(input) input.focus(); }, 60);
    return false;
  }

  function closeWorkspace(){
    hideWorkspaceOnly();
    var anyActive = document.querySelector('.content-pane.active, #aiAnswerPane.active');
    var welcome = byId('welcomeMsg');
    if(welcome && !anyActive) welcome.style.display = '';
    return false;
  }

  function syncButtons(){
    document.querySelectorAll('[data-sugo-ask-option]').forEach(function(btn){
      var key = btn.getAttribute('data-sugo-ask-option');
      var val = btn.getAttribute('data-value');
      btn.classList.toggle('active', askState[key] === val);
      btn.setAttribute('aria-pressed', askState[key] === val ? 'true' : 'false');
    });
    var hint = byId('sugoAskAIHint');
    if(hint){
      if(askState.focus === 'sop_check') hint.textContent = 'SOP check mode: verifies the strongest KB match, confidence, and missing details before answering.';
      else if(askState.focus === 'troubleshoot') hint.textContent = 'Troubleshooting mode: returns ordered actions, evidence needed, and escalation trigger.';
      else if(askState.focus === 'escalation') hint.textContent = 'Escalation mode: checks whether escalation is needed and what information must be attached.';
      else hint.textContent = 'Agent guidance mode: correct action, policy conditions, missing info, and safe support guidance.';
    }
  }

  function submitWorkspace(){
    var panel = byId('sugoAskAIWorkspace');
    var input = byId('sugoAskAIInput');
    var q = (input && input.value || currentSearchText()).trim();
    if(!q){
      if(panel){
        panel.classList.add('sugo-shake');
        setTimeout(function(){ panel.classList.remove('sugo-shake'); }, 520);
      }
      if(input) input.focus();
      return false;
    }
    var search = byId('searchInput');
    if(search) search.value = q;
    applyAskStateToLegacyControls();
    hideWorkspaceOnly();
    if(typeof window.askAI === 'function'){
      window.askAI(q, false, false, {
        forceOutputType: 'answer',
        forceResponseMode: askState.response,
        smartTicket: false,
        kbQuery: q,
        askToolInstruction: focusInstruction()
      });
    }
    return false;
  }

  function clearWorkspace(){
    var input = byId('sugoAskAIInput');
    if(input){ input.value = ''; input.focus(); }
    return false;
  }

  document.addEventListener('click', function(e){
    var opt = e.target.closest('[data-sugo-ask-option]');
    if(opt){
      e.preventDefault();
      var key = opt.getAttribute('data-sugo-ask-option');
      var val = opt.getAttribute('data-value');
      if(key && val && Object.prototype.hasOwnProperty.call(askState, key)){
        askState[key] = val;
        syncButtons();
      }
      return;
    }
    var chip = e.target.closest('[data-sugo-ask-chip]');
    if(chip){
      e.preventDefault();
      var text = chip.getAttribute('data-sugo-ask-chip') || '';
      var input = byId('sugoAskAIInput');
      if(input){
        var current = input.value.trim();
        input.value = current ? current + "\n" + text : text;
        input.focus();
      }
    }
  }, true);

  document.addEventListener('keydown', function(e){
    var input = byId('sugoAskAIInput');
    if(e.target === input && e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      submitWorkspace();
    }
  });

  window.sugoOpenAskAIWorkspace = openWorkspace;
  window.sugoCloseAskAIWorkspace = closeWorkspace;
  window.sugoSubmitAskAIWorkspace = submitWorkspace;
  window.sugoAskAIClear = clearWorkspace;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncButtons);
  else syncButtons();
})();
