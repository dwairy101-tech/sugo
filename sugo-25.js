(function(){
  var ticketState = {
    language: 'english',
    response: 'detailed',
    sop: 'sop_only',
    type: 'customer_reply',
    tone: 'professional'
  };

  function byId(id){ return document.getElementById(id); }
  function currentSearchText(){ return (byId('searchInput') && byId('searchInput').value || '').trim(); }

  // SUGO FIX 2026-07-07 v2 — Create Ticket accuracy
  // Quick prompt text must never become part of the SOP search query.
  // The matcher should search the real customer case/evidence only, then force the best Ticket macro when confidence is strong.
  var SUGO_TICKET_CONTROL_LINES = [
    'write a ready-to-send customer support reply based on this case.',
    'write a polite missing-information request and list exactly what the user must provide.',
    'create an internal escalation summary with evidence required and recommended next team/action.',
    'rewrite the customer reply to be shorter, safer, and more professional.',
    'ready reply',
    'missing info',
    'escalation note',
    'polish reply',
    'create ticket workspace request.',
    'selected ticket type:',
    'selected tone:',
    'customer/case details:'
  ];

  function normalizeTicketLine(value){
    return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function cleanTicketCaseText(value){
    var lines = String(value || '').replace(/\r/g, '').split('\n');
    var kept = [];
    lines.forEach(function(line){
      var clean = line.trim();
      if(!clean) return;
      var n = normalizeTicketLine(clean);
      var isControl = SUGO_TICKET_CONTROL_LINES.some(function(control){
        control = normalizeTicketLine(control);
        return n === control || n.indexOf(control) === 0;
      });
      if(!isControl) kept.push(clean);
    });
    return kept.join('\n').trim();
  }

  function buildTicketLookupQuery(raw){
    var parts = [];
    var cleanRaw = cleanTicketCaseText(raw);
    var evidence = cleanTicketCaseText(byId('sugoTicketEvidence') && byId('sugoTicketEvidence').value || '');
    if(cleanRaw) parts.push(cleanRaw);
    if(evidence) parts.push(evidence);
    return parts.join('\n').trim();
  }

  function normalizeArabicTicketQuery(value){
    return String(value || '')
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه')
      .replace(/[ـ]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function ticketAliasMatch(lookupQuery){
    var q = normalizeArabicTicketQuery(lookupQuery);
    if(!q) return null;

    // Exact ticket-topic aliases for short Arabic queries.
    // Without this, a short input such as "انشاء وكاله" can be too broad and the
    // matcher may select a generic optimized topic instead of the correct Ticket macro.
    if(/(وكاله|وكالة|agency)/.test(q)){
      if(/(شحن|recharge|top ?up|coins|كوين|دفع)/.test(q)){
        return { paneId:'sv-tickets-agency-create-recharge', title:'Create Recharge Agency', confidence:'high', score:999 };
      }
      if(/(فرعي|فرعيه|sub agency|sub-agency|subagency)/.test(q)){
        return { paneId:'sv-tickets-agency-create-sub', title:'Create Sub Agency', confidence:'high', score:999 };
      }
      if(/(تحويل|ترقيه|ترقية|main agency|وكاله اساسيه|وكالة اساسية)/.test(q)){
        return { paneId:'sv-tickets-agency-change-sub-to-main', title:'Change Sub Agency to Main Agency', confidence:'high', score:999 };
      }
      if(/(انشاء|انشا|فتح|تقديم|طلب|create|open|apply|مضيف|مضيفات|host|anchor)/.test(q)){
        return { paneId:'sv-tickets-agency-create', title:'Create Agency', confidence:'high', score:999 }; /* fixed: exact ticket macro */
      }
    }
    return null;
  }

  function findStrongTicketPaneId(lookupQuery){
    var out = { paneId:null, title:'', confidence:'low', score:0 };
    if(!lookupQuery) return out;
    var alias = ticketAliasMatch(lookupQuery);
    if(alias) return alias;
    if(typeof window.getRelevantKnowledgeBaseText !== 'function') return out;
    try{
      var kb = window.getRelevantKnowledgeBaseText(lookupQuery, 10, 1800, null, {
        outputType:'ticket',
        preferTicketTopics:true,
        smartTicket:true,
        compactPrompt:true,
        completeAnswer:true
      });
      var topics = (kb && kb.topics) || [];
      function isTicketTopic(t){ return t && /^sv-tickets-/.test(String(t.id || '')); }
      var primaryTicket = topics.find(function(t){ return isTicketTopic(t) && t.primary; });
      var strongTicket = primaryTicket || topics.find(function(t){
        var score = Number(t.score || 0);
        return isTicketTopic(t) && (score >= 28 || t.selected || kb.confidence === 'high');
      });
      if(strongTicket){
        out.paneId = strongTicket.id;
        out.title = strongTicket.title || strongTicket.label || strongTicket.id;
        out.confidence = kb.confidence || 'medium';
        out.score = Math.round(Number(strongTicket.score || kb.confidenceScore || 0) * 10) / 10;
      }
    }catch(e){}
    return out;
  }

  function setTicketType(value){
    if(!value) return;
    ticketState.type = value;
    syncButtons();
  }

  function setHiddenSelect(id, value){
    var el = byId(id);
    if(!el) return;
    if(Array.from(el.options || []).some(function(opt){ return opt.value === value; })){
      el.value = value;
      try{ el.dispatchEvent(new Event('change', { bubbles:true })); }catch(e){}
    }
  }

  function applyTicketStateToLegacyControls(){
    setHiddenSelect('languageSelect', ticketState.language);
    setHiddenSelect('outputTypeSelect', 'ticket');
    setHiddenSelect('sopModeSelect', ticketState.sop);
    setHiddenSelect('responseModeSelect', ticketState.response);
    if(typeof window.setResponseMode === 'function'){
      try{ window.setResponseMode(ticketState.response); }catch(e){}
    }
  }

  function closeAskWorkspaceSilently(){
    var panel = byId('sugoAskAIWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage2-ask-open');
  }

  function hideWorkspaceOnly(){
    var panel = byId('sugoTicketWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage3-ticket-open');
  }

  function openWorkspace(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var panel = byId('sugoTicketWorkspace');
    if(!panel){
      if(typeof window.createSmartTicket === 'function') window.createSmartTicket(currentSearchText());
      return false;
    }
    closeAskWorkspaceSilently();
    var input = byId('sugoTicketInput');
    var source = currentSearchText();
    if(input && source && !input.value.trim()) input.value = source;

    try{ document.querySelectorAll('.content-pane.active').forEach(function(el){ el.classList.remove('active'); }); }catch(e){}
    var aiPane = byId('aiAnswerPane');
    if(aiPane) aiPane.classList.remove('active');
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    var breadcrumb = byId('sugoBreadcrumb');
    if(breadcrumb) breadcrumb.innerHTML = '';

    panel.hidden = false;
    panel.classList.add('active');
    var area = byId('contentArea');
    if(area) area.classList.add('sugo-stage3-ticket-open');
    syncButtons();
    setTimeout(function(){ if(input) input.focus(); }, 60);
    return false;
  }

  function closeWorkspace(){
    hideWorkspaceOnly();
    var anyActive = document.querySelector('.content-pane.active, #aiAnswerPane.active, #sugoAskAIWorkspace.active');
    var welcome = byId('welcomeMsg');
    if(welcome && !anyActive) welcome.style.display = '';
    return false;
  }

  function syncButtons(){
    document.querySelectorAll('[data-sugo-ticket-option]').forEach(function(btn){
      var key = btn.getAttribute('data-sugo-ticket-option');
      var val = btn.getAttribute('data-value');
      var active = ticketState[key] === val;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var hint = byId('sugoTicketHint');
    if(hint){
      if(ticketState.type === 'missing_info') hint.textContent = 'Missing information mode: write a polite request that asks only for required data/evidence.';
      else if(ticketState.type === 'internal_escalation') hint.textContent = 'Internal escalation mode: summarize the issue, evidence, missing info, and recommended escalation path.';
      else if(ticketState.type === 'policy_sensitive') hint.textContent = 'Policy-sensitive mode: avoid promises, avoid blame, and keep wording safe for bans, abuse, payments, VIP, agency, or withdrawals.';
      else hint.textContent = 'Customer reply mode: write a clean ready-to-send SUGO support response.';
    }
    var preview = byId('sugoTicketTemplatePreview');
    if(preview){
      var typeText = {
        customer_reply: 'clean customer-facing ticket',
        missing_info: 'missing-information request',
        internal_escalation: 'internal escalation summary',
        policy_sensitive: 'safe policy-sensitive reply'
      }[ticketState.type] || 'ticket';
      var toneText = {
        professional: 'professional',
        empathetic: 'empathetic',
        firm: 'firm but polite'
      }[ticketState.tone] || 'professional';
      preview.innerHTML = '<strong>Output:</strong> ' + typeText + ' · ' + toneText + ' · ' + (ticketState.sop === 'sop_only' ? 'SOP Only' : 'Hybrid') + '.';
    }
  }

  function ticketInstruction(){
    var typeRules = {
      customer_reply: 'Create a ready-to-send customer-facing support ticket/reply. Include a natural greeting, clear action/result, any required missing information, and a natural polite closing from SUGO Customer Support Team.',
      missing_info: 'Create a polite missing-information request only. Ask for the exact required details/evidence and do not promise resolution before those details are provided.',
      internal_escalation: 'Create an internal escalation note, not a customer reply. Include case summary, suspected category, evidence attached, missing evidence, risk level, and recommended next team/action.',
      policy_sensitive: 'Create a safe policy-sensitive reply. Avoid blame, avoid guarantees, avoid unsupported policy claims, and request verification/escalation when required.'
    };
    var toneRules = {
      professional: 'Use a professional, concise support tone.',
      empathetic: 'Use a warmer empathetic tone while staying concise and policy-safe.',
      firm: 'Use a firm but polite tone. Do not sound aggressive.'
    };
    return [
      'This request came from the dedicated Create Ticket workspace, not the Ask AI guidance workspace.',
      'Output type is locked to Ticket. Do not provide analysis before the ticket unless the selected ticket type is internal escalation.',
      typeRules[ticketState.type] || typeRules.customer_reply,
      toneRules[ticketState.tone] || toneRules.professional,
      'Do not duplicate greetings or closings. Do not add fake ticket IDs, fake dates, fake agent names, or unsupported SLA promises.',
      'If facts are missing, ask for them clearly instead of inventing them.'
    ].join(' ');
  }

  function buildTicketQuery(raw){
    var parts = [];
    var cleanRaw = cleanTicketCaseText(raw);
    var userId = (byId('sugoTicketUserId') && byId('sugoTicketUserId').value || '').trim();
    var orderId = (byId('sugoTicketOrderId') && byId('sugoTicketOrderId').value || '').trim();
    var evidence = cleanTicketCaseText(byId('sugoTicketEvidence') && byId('sugoTicketEvidence').value || '');
    if(cleanRaw) parts.push('Customer/case details:\n' + cleanRaw);
    if(userId) parts.push('User ID / UID: ' + userId);
    if(orderId) parts.push('Related ID / Order / Room / Agency ID: ' + orderId);
    if(evidence) parts.push('Evidence / internal notes:\n' + evidence);
    parts.push('Ticket request profile: ' + ticketState.type + ' · ' + ticketState.tone + ' tone.');
    return parts.filter(Boolean).join('\n\n').trim();
  }

  function submitWorkspace(){
    var panel = byId('sugoTicketWorkspace');
    var input = byId('sugoTicketInput');
    var rawSource = (input && input.value || currentSearchText()).trim();
    var lookupQuery = buildTicketLookupQuery(rawSource) || cleanTicketCaseText(rawSource) || currentSearchText();
    var hasImage = false;
    try{ hasImage = (typeof sugoAiAttachedImage !== 'undefined' && !!sugoAiAttachedImage); }catch(e){}
    if(!lookupQuery && !hasImage){
      if(panel){ panel.classList.add('sugo-shake'); setTimeout(function(){ panel.classList.remove('sugo-shake'); }, 520); }
      if(input) input.focus();
      return false;
    }
    var finalQuery = lookupQuery ? buildTicketQuery(rawSource || lookupQuery) : 'Create a ready-to-send customer support ticket based on the attached image.';
    var forced = findStrongTicketPaneId(lookupQuery);
    var search = byId('searchInput');
    if(search) search.value = lookupQuery || finalQuery;
    applyTicketStateToLegacyControls();
    hideWorkspaceOnly();
    if(typeof window.askAI === 'function'){
      var forcedInstruction = forced.paneId
        ? ('\nExact Ticket SOP selected by local matcher: ' + forced.paneId + ' — ' + forced.title + '. Use this Ticket macro as the controlling source. Do not replace it with a broader optimized/overview article unless the case details clearly contradict it.')
        : '\nNo exact Ticket macro was strong enough. Use the strongest SOP match cautiously and ask for missing details if needed.';
      window.askAI(finalQuery, false, false, {
        forceOutputType: 'ticket',
        forceResponseMode: ticketState.response,
        smartTicket: true,
        kbQuery: lookupQuery,
        exactPaneId: forced.paneId || null,
        allowActivePaneBias: false,
        askToolInstruction: ticketInstruction() + forcedInstruction
      });
    }
    return false;
  }

  function clearWorkspace(){
    ['sugoTicketInput','sugoTicketUserId','sugoTicketOrderId','sugoTicketEvidence'].forEach(function(id){ var el = byId(id); if(el) el.value = ''; });
    var input = byId('sugoTicketInput');
    if(input) input.focus();
    return false;
  }

  document.addEventListener('click', function(e){
    var opt = e.target.closest('[data-sugo-ticket-option]');
    if(opt){
      e.preventDefault();
      var key = opt.getAttribute('data-sugo-ticket-option');
      var val = opt.getAttribute('data-value');
      if(key && val && Object.prototype.hasOwnProperty.call(ticketState, key)){
        ticketState[key] = val;
        syncButtons();
      }
      return;
    }
    var chip = e.target.closest('[data-sugo-ticket-chip]');
    if(chip){
      e.preventDefault();
      var text = normalizeTicketLine(chip.getAttribute('data-sugo-ticket-chip') || '');
      if(text.indexOf('missing-information') >= 0 || text.indexOf('missing information') >= 0){
        setTicketType('missing_info');
      }else if(text.indexOf('escalation') >= 0){
        setTicketType('internal_escalation');
      }else if(text.indexOf('policy') >= 0){
        setTicketType('policy_sensitive');
      }else{
        setTicketType('customer_reply');
      }
      var input = byId('sugoTicketInput');
      if(input) input.focus();
    }
  }, true);

  document.addEventListener('keydown', function(e){
    var input = byId('sugoTicketInput');
    if(e.target === input && e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      submitWorkspace();
    }
  });

  var originalAskOpen = window.sugoOpenAskAIWorkspace;
  if(typeof originalAskOpen === 'function'){
    window.sugoOpenAskAIWorkspace = function(event){
      hideWorkspaceOnly();
      return originalAskOpen(event);
    };
  }

  window.sugoOpenTicketWorkspace = openWorkspace;
  window.sugoCloseTicketWorkspace = closeWorkspace;
  window.sugoSubmitTicketWorkspace = submitWorkspace;
  window.sugoTicketClear = clearWorkspace;

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', syncButtons);
  else syncButtons();
})();
