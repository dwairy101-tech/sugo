(function(){
  var visionState = {
    language: 'english',
    output: 'answer',
    response: 'brief',
    sop: 'hybrid',
    analysis: 'screenshot_case'
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

  function applyVisionStateToLegacyControls(){
    setHiddenSelect('languageSelect', visionState.language);
    setHiddenSelect('outputTypeSelect', visionState.output);
    setHiddenSelect('sopModeSelect', visionState.sop);
    setHiddenSelect('responseModeSelect', visionState.response);
    if(typeof window.setResponseMode === 'function'){
      try{ window.setResponseMode(visionState.response); }catch(e){}
    }
  }

  function escapeLocal(text){
    if(typeof window.escapeHtml === 'function') return window.escapeHtml(text);
    return String(text || '').replace(/[&<>'"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch];
    });
  }

  function setWorkspaceStatus(message, isError){
    var el = byId('sugoVisionWorkspaceStatus');
    if(!el) return;
    if(!message){
      el.classList.remove('active','error');
      el.textContent = '';
      return;
    }
    el.textContent = message;
    el.classList.add('active');
    el.classList.toggle('error', !!isError);
  }

  function renderPreviewElement(preview){
    if(!preview) return;
    var img = null;
    try{ img = sugoAiAttachedImage; }catch(e){ img = null; }
    if(!img){
      preview.classList.remove('has-image');
      preview.innerHTML = '';
      return;
    }
    var sizeText = typeof window.sugoFormatBytes === 'function' ? window.sugoFormatBytes(img.size) : ((img.size || 0) + ' B');
    preview.classList.add('has-image');
    preview.innerHTML = '' +
      '<img class="sugo-vision-thumb" src="' + img.previewDataUrl + '" alt="Attached image preview">' +
      '<div class="sugo-vision-meta">' +
        '<div class="sugo-vision-name">' + escapeLocal(img.name) + '</div>' +
        '<div class="sugo-vision-sub">' + escapeLocal(img.width + '×' + img.height + ' · ' + sizeText + ' compressed') + '</div>' +
      '</div>' +
      '<button class="sugo-vision-clear" type="button" onclick="clearSugoVisionImage(); if(window.sugoRenderVisionWorkspacePreview) window.sugoRenderVisionWorkspacePreview();" title="Remove image">×</button>';
  }

  function renderAllVisionPreviews(){
    renderPreviewElement(byId('sugoVisionPreview'));
    renderPreviewElement(byId('sugoVisionWorkspacePreview'));
  }

  function closeAskWorkspaceSilently(){
    var panel = byId('sugoAskAIWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage2-ask-open');
  }

  function closeTicketWorkspaceSilently(){
    var panel = byId('sugoTicketWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage3-ticket-open');
  }

  function hideWorkspaceOnly(){
    var panel = byId('sugoVisionWorkspace');
    if(panel){ panel.classList.remove('active'); panel.hidden = true; }
    var area = byId('contentArea');
    if(area) area.classList.remove('sugo-stage4-vision-open');
  }

  function openWorkspace(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    var panel = byId('sugoVisionWorkspace');
    if(!panel){
      if(typeof window.sugoTriggerVisionUpload === 'function') window.sugoTriggerVisionUpload();
      return false;
    }
    closeAskWorkspaceSilently();
    closeTicketWorkspaceSilently();

    try{ document.querySelectorAll('.content-pane.active').forEach(function(el){ el.classList.remove('active'); }); }catch(e){}
    var aiPane = byId('aiAnswerPane');
    if(aiPane) aiPane.classList.remove('active');
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    var breadcrumb = byId('sugoBreadcrumb');
    if(breadcrumb) breadcrumb.innerHTML = '';

    var note = byId('sugoVisionCaseNote');
    var source = currentSearchText();
    if(note && source && !note.value.trim()) note.value = source;

    panel.hidden = false;
    panel.classList.add('active');
    var area = byId('contentArea');
    if(area) area.classList.add('sugo-stage4-vision-open');
    syncButtons();
    renderAllVisionPreviews();
    setTimeout(function(){
      var drop = byId('sugoVisionDropzone');
      if(drop) drop.focus();
    }, 60);
    return false;
  }

  function closeWorkspace(){
    hideWorkspaceOnly();
    var anyActive = document.querySelector('.content-pane.active, #aiAnswerPane.active, #sugoAskAIWorkspace.active, #sugoTicketWorkspace.active');
    var welcome = byId('welcomeMsg');
    if(welcome && !anyActive) welcome.style.display = '';
    return false;
  }

  function triggerUpload(){
    var input = byId('sugoVisionWorkspaceInput') || byId('sugoVisionInput');
    if(input) input.click();
    return false;
  }

  async function handleWorkspaceImage(file){
    if(!file) return false;
    setWorkspaceStatus('Preparing image for AI analysis…', false);
    try{
      if(typeof window.handleSugoVisionImage === 'function') await window.handleSugoVisionImage(file);
      else throw new Error('Image upload handler is not available.');
      renderAllVisionPreviews();
      setWorkspaceStatus('Image is ready. Add notes if needed, then click Analyze Image.', false);
      var submitBtn = byId('sugoVisionSubmit');
      if(submitBtn) setTimeout(function(){ submitBtn.focus(); }, 80);
    }catch(err){
      renderAllVisionPreviews();
      setWorkspaceStatus((err && err.message) || String(err), true);
    }
    return false;
  }

  function syncButtons(){
    document.querySelectorAll('[data-sugo-vision-option]').forEach(function(btn){
      var key = btn.getAttribute('data-sugo-vision-option');
      var val = btn.getAttribute('data-value');
      var active = visionState[key] === val;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    var preview = byId('sugoVisionOptionPreview');
    if(preview){
      var analysisText = {
        screenshot_case: 'screenshot reading',
        ban_moderation: 'ban / moderation evidence',
        payment_evidence: 'payment or withdrawal evidence',
        account_identity: 'account / profile / agency check',
        app_error: 'app error / crash screenshot'
      }[visionState.analysis] || 'image analysis';
      preview.innerHTML = '<strong>Output:</strong> ' + (visionState.output === 'ticket' ? 'Vision ticket' : 'Vision answer') + ' · ' + analysisText + ' · ' + (visionState.sop === 'sop_only' ? 'SOP Only' : 'Hybrid') + '.';
    }
  }

  function visionInstruction(){
    var analysisRules = {
      screenshot_case: 'Read the screenshot carefully. Identify visible text, error messages, UI state, account or transaction clues, and the likely support category. Separate what is visible from what is assumed.',
      ban_moderation: 'Treat the image as possible moderation or ban evidence. Describe only visible evidence, avoid unsupported accusations, and use safe policy wording. If the image is insufficient, request more evidence or escalate.',
      payment_evidence: 'Treat the image as recharge, payment, withdrawal, exchange, or balance evidence. Extract visible amounts, order IDs, dates, status messages, and missing details before escalation. Do not promise refunds or credit.',
      account_identity: 'Treat the image as account, profile, agency, host, or identity evidence. Extract visible IDs/names/status carefully and request verification if ownership or identity is not conclusive.',
      app_error: 'Treat the image as an app issue screenshot. Identify the exact visible error or crash state, then give refresh/log/upload/cache/device steps and escalation trigger if the issue continues.'
    };
    return [
      'This request came from the dedicated Upload Image workspace, not the normal Ask AI or Create Ticket workspace.',
      'The image is the primary evidence. Read visible content carefully, but never invent unreadable text, hidden details, IDs, amounts, dates, or policy decisions.',
      analysisRules[visionState.analysis] || analysisRules.screenshot_case,
      visionState.output === 'ticket'
        ? 'Final output must be a customer-ready Vision Ticket. Use the image as evidence internally, but do not mention internal analysis, confidence labels, or source chips.'
        : 'Final output must be agent-facing Vision Answer. Include visible findings, likely SOP match, correct action, missing information, and escalation path when needed.',
      'For sensitive cases such as ban, abuse, recharge, withdrawal, VIP, agency, host, identity, or account ownership, be conservative and request verification/escalation if the SOP or image is not conclusive.'
    ].join(' ');
  }

  function buildVisionQuery(){
    var parts = [];
    parts.push('Upload Image workspace request.');
    parts.push('Selected image analysis type: ' + visionState.analysis + '.');
    parts.push('Selected output: ' + visionState.output + '.');
    var userId = (byId('sugoVisionUserId') && byId('sugoVisionUserId').value || '').trim();
    var contextId = (byId('sugoVisionContextId') && byId('sugoVisionContextId').value || '').trim();
    var note = (byId('sugoVisionCaseNote') && byId('sugoVisionCaseNote').value || '').trim();
    if(userId) parts.push('User ID / UID: ' + userId);
    if(contextId) parts.push('Order / Room / Agency ID: ' + contextId);
    if(note) parts.push('Case note / requested check:\n' + note);
    if(!note){
      parts.push(visionState.output === 'ticket'
        ? 'Create a safe customer-ready reply based on the attached image and the strongest SUGO SOP match.'
        : 'Analyze the attached image and explain the visible issue, likely SOP match, correct agent action, missing information, and escalation path if needed.');
    }
    return parts.join('\n\n');
  }

  function submitWorkspace(){
    var panel = byId('sugoVisionWorkspace');
    var hasImage = false;
    try{ hasImage = (typeof sugoAiAttachedImage !== 'undefined' && !!sugoAiAttachedImage); }catch(e){}
    if(!hasImage){
      if(panel){ panel.classList.add('sugo-shake'); setTimeout(function(){ panel.classList.remove('sugo-shake'); }, 520); }
      setWorkspaceStatus('Please upload an image first.', true);
      triggerUpload();
      return false;
    }
    var finalQuery = buildVisionQuery();
    var search = byId('searchInput');
    if(search) search.value = (byId('sugoVisionCaseNote') && byId('sugoVisionCaseNote').value || '').trim() || finalQuery;
    applyVisionStateToLegacyControls();
    setWorkspaceStatus('Sending image to AI analysis…', false);
    hideWorkspaceOnly();
    if(typeof window.askAI === 'function'){
      var img = null;
      try{ img = sugoAiAttachedImage; }catch(e){ img = null; }
      var noteForKb = (byId('sugoVisionCaseNote') && byId('sugoVisionCaseNote').value || '').trim();
      var analysisKbMap = {
        screenshot_case: 'screenshot visible issue support case SUGO app',
        ban_moderation: 'ban abuse report moderation violation screenshot evidence',
        payment_evidence: 'recharge payment withdrawal invoice transaction receipt screenshot',
        account_identity: 'account profile identity verification user id agency host screenshot',
        app_error: 'app error crash bug technical issue screenshot not working'
      };
      window.askAI(finalQuery, false, false, {
        forceOutputType: visionState.output,
        forceResponseMode: visionState.response,
        smartTicket: visionState.output === 'ticket',
        kbQuery: noteForKb || analysisKbMap[visionState.analysis] || 'image screenshot support issue',
        askToolInstruction: visionInstruction(),
        _attachedImage: img
      });
    }
    return false;
  }

  function clearWorkspace(){
    ['sugoVisionUserId','sugoVisionContextId','sugoVisionCaseNote'].forEach(function(id){ var el = byId(id); if(el) el.value = ''; });
    if(typeof window.clearSugoVisionImage === 'function') window.clearSugoVisionImage();
    renderAllVisionPreviews();
    setWorkspaceStatus('', false);
    return false;
  }

  document.addEventListener('click', function(e){
    var opt = e.target.closest('[data-sugo-vision-option]');
    if(opt){
      e.preventDefault();
      var key = opt.getAttribute('data-sugo-vision-option');
      var val = opt.getAttribute('data-value');
      if(key && val && Object.prototype.hasOwnProperty.call(visionState, key)){
        visionState[key] = val;
        syncButtons();
      }
      return;
    }
    var chip = e.target.closest('[data-sugo-vision-chip]');
    if(chip){
      e.preventDefault();
      var text = chip.getAttribute('data-sugo-vision-chip') || '';
      var input = byId('sugoVisionCaseNote');
      if(input){
        var current = input.value.trim();
        input.value = current ? current + '\n' + text : text;
        input.focus();
      }
    }
  }, true);

  document.addEventListener('keydown', function(e){
    var drop = byId('sugoVisionDropzone');
    if(e.target === drop && (e.key === 'Enter' || e.key === ' ')){
      e.preventDefault();
      triggerUpload();
      return;
    }
    var note = byId('sugoVisionCaseNote');
    if(e.target === note && e.key === 'Enter' && (e.ctrlKey || e.metaKey)){
      e.preventDefault();
      submitWorkspace();
    }
  });

  var dropzoneReady = false;
  function setupDropzone(){
    if(dropzoneReady) return;
    var drop = byId('sugoVisionDropzone');
    if(!drop) return;
    dropzoneReady = true;
    ['dragenter','dragover'].forEach(function(type){
      drop.addEventListener(type, function(e){ e.preventDefault(); e.stopPropagation(); drop.classList.add('dragging'); });
    });
    ['dragleave','drop'].forEach(function(type){
      drop.addEventListener(type, function(e){ e.preventDefault(); e.stopPropagation(); drop.classList.remove('dragging'); });
    });
    drop.addEventListener('drop', function(e){
      var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if(file) handleWorkspaceImage(file);
    });
  }

  // Override preview rendering so both the hidden legacy sidebar preview and the new workspace preview stay in sync.
  window.sugoRenderVisionWorkspacePreview = renderAllVisionPreviews;
  window.renderSugoVisionPreview = renderAllVisionPreviews;

  var originalAskOpen = window.sugoOpenAskAIWorkspace;
  if(typeof originalAskOpen === 'function'){
    window.sugoOpenAskAIWorkspace = function(event){
      hideWorkspaceOnly();
      return originalAskOpen(event);
    };
  }

  var originalTicketOpen = window.sugoOpenTicketWorkspace;
  if(typeof originalTicketOpen === 'function'){
    window.sugoOpenTicketWorkspace = function(event){
      hideWorkspaceOnly();
      return originalTicketOpen(event);
    };
  }

  window.sugoOpenVisionWorkspace = openWorkspace;
  window.sugoCloseVisionWorkspace = closeWorkspace;
  window.sugoTriggerVisionWorkspaceUpload = triggerUpload;
  window.sugoHandleVisionWorkspaceImage = handleWorkspaceImage;
  window.sugoSubmitVisionWorkspace = submitWorkspace;
  window.sugoVisionClearWorkspace = clearWorkspace;

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ syncButtons(); setupDropzone(); renderAllVisionPreviews(); });
  }else{
    syncButtons(); setupDropzone(); renderAllVisionPreviews();
  }
})();
