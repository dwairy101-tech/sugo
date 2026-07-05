// Extracted from index(94).html: <script id="sugo-topic-dropdown-hard-open-fix-v3">
(function(){
  'use strict';
  if(window.__SUGO_TOPIC_DROPDOWN_HARD_OPEN_FIX_V3__) return;
  window.__SUGO_TOPIC_DROPDOWN_HARD_OPEN_FIX_V3__ = true;

  function byId(id){ return document.getElementById(id); }
  function cleanText(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
  function visibleWelcome(){
    var w = byId('welcomeMsg');
    if(!w) return false;
    var cs = window.getComputedStyle ? getComputedStyle(w) : null;
    return w.style.display !== 'none' && (!cs || cs.display !== 'none');
  }
  function activePaneId(){
    var p = document.querySelector('.content-pane.active');
    return p && p.id ? p.id.replace(/^pane-/,'') : '';
  }
  function paneExists(paneId){
    try{ return !!(paneId && typeof paneContent !== 'undefined' && paneContent && paneContent[paneId]); }catch(e){ return false; }
  }
  function selectedOption(sel){ return sel && sel.selectedIndex >= 0 ? sel.options[sel.selectedIndex] : null; }
  window.__SUGO_SUPPRESS_OPEN_PANE = window.__SUGO_SUPPRESS_OPEN_PANE || '';

  function selectedTopicPaneId(){
    var select = byId('sugoCascadeTopic');
    if(!select || !select.value) return '';
    var opt = selectedOption(select);
    if(!opt) return '';

    var pane = opt.getAttribute('data-smart-pane') || opt.getAttribute('data-pane') || opt.getAttribute('data-sugo-pane') || '';
    if(pane) return pane;

    var topicLabel = cleanText(opt.textContent);
    if(!topicLabel) return '';

    var sectionSelect = byId('sugoCascadeSection');
    var sectionOpt = selectedOption(sectionSelect);
    var sectionLabel = cleanText(sectionOpt && sectionOpt.textContent);

    var categorySelect = byId('sugoCascadeCategory');
    var categoryOpt = selectedOption(categorySelect);
    var categoryLabel = cleanText(categoryOpt && categoryOpt.textContent);

    var librarySelect = byId('sugoLibrarySelect');
    var libraryOpt = selectedOption(librarySelect);
    var libraryLabel = cleanText(libraryOpt && libraryOpt.textContent);

    var candidates = Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn')).filter(function(btn){
      return cleanText(btn.textContent) === topicLabel;
    });

    if(sectionLabel){
      var sectionMatches = candidates.filter(function(btn){
        var sec = btn.closest('.nav-l00');
        var secBtn = sec && sec.querySelector('.nav-l00-btn span');
        return cleanText(secBtn && secBtn.textContent) === sectionLabel;
      });
      if(sectionMatches.length) candidates = sectionMatches;
    }

    if(categoryLabel){
      var catMatches = candidates.filter(function(btn){
        var cat = btn.closest('.nav-l0');
        var catBtn = cat && cat.querySelector('.nav-l0-btn span');
        return cleanText(catBtn && catBtn.textContent) === categoryLabel;
      });
      if(catMatches.length) candidates = catMatches;
    }

    if(libraryLabel){
      var libMatches = candidates.filter(function(btn){
        var root = btn.closest('.nav-lroot');
        var rootBtn = root && root.querySelector('.nav-lroot-btn span');
        return cleanText(rootBtn && rootBtn.textContent) === libraryLabel;
      });
      if(libMatches.length) candidates = libMatches;
    }

    return candidates[0] ? (candidates[0].getAttribute('data-pane') || '') : '';
  }

  function activatePaneManually(paneId){
    if(!paneId) return false;
    var pane = byId('pane-' + paneId);
    if(!pane && typeof preparePaneElement === 'function'){
      try{ pane = preparePaneElement(paneId); }catch(e){}
    }
    if(!pane && paneExists(paneId)){
      var contentArea = byId('contentArea');
      if(!contentArea) return false;
      var html = '';
      try{
        var row = paneContent[paneId];
        html = typeof row === 'object' ? (row.en || row.html || '') : String(row || '');
      }catch(e){}
      pane = document.createElement('div');
      pane.className = 'content-pane';
      pane.id = 'pane-' + paneId;
      pane.innerHTML = '<button class="close-pane-btn" type="button" onclick="showOnlyWelcome && showOnlyWelcome()">✕</button><div>' + html + '</div>';
      contentArea.appendChild(pane);
    }
    if(!pane) return false;
    document.querySelectorAll('.content-pane,.ai-answer-pane').forEach(function(p){ p.classList.remove('active'); });
    var welcome = byId('welcomeMsg');
    if(welcome) welcome.style.display = 'none';
    pane.classList.add('active');
    window.SUGO_ACTIVE_PANE = paneId;
    window.SUGO_ACTIVE_PANE_TS = Date.now();
    try{ localStorage.setItem('sugo_last_pane', paneId); }catch(e){}
    document.querySelectorAll('.nav-l000-btn').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-pane') === paneId); });
    return true;
  }

  function openPaneHard(paneId){
    if(!paneId) return false;
    var ok = false;
    try{
      if(window.SUGOFavoritesOpenHotfix && typeof window.SUGOFavoritesOpenHotfix.open === 'function'){
        ok = !!window.SUGOFavoritesOpenHotfix.open(paneId);
      }
    }catch(e){}
    if(!ok){
      try{
        if(typeof window.showPane === 'function'){ window.showPane(paneId, true); ok = true; }
        else if(typeof showPane === 'function'){ showPane(paneId, true); ok = true; }
      }catch(e){ ok = false; }
    }
    setTimeout(function(){
      var active = activePaneId();
      if(active !== paneId || visibleWelcome()) activatePaneManually(paneId);
      if(window.__SUGO_DIRECT_SECTION_EDIT__ && typeof window.dispatchEvent === 'function'){
        try{ window.dispatchEvent(new CustomEvent('sugo:pane-opened', {detail:{paneId:paneId}})); }catch(e){}
      }
    }, 80);
    if(!ok) return activatePaneManually(paneId);
    return true;
  }

  function repairSelectedTopicOpen(){
    var paneId = selectedTopicPaneId();
    if(!paneId) return;
    if(window.__SUGO_SUPPRESS_OPEN_PANE === paneId) return;
    if(activePaneId() !== paneId || visibleWelcome()) openPaneHard(paneId);
  }

  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'sugoCascadeTopic'){
      window.__SUGO_SUPPRESS_OPEN_PANE = '';
      setTimeout(repairSelectedTopicOpen, 0);
      setTimeout(repairSelectedTopicOpen, 120);
      setTimeout(repairSelectedTopicOpen, 450);
    }
  }, true);

  document.addEventListener('click', function(e){
    var topicBtn = e.target && e.target.closest && e.target.closest('.nav-l000-btn[data-pane]');
    if(topicBtn){
      var paneId = topicBtn.getAttribute('data-pane');
      setTimeout(function(){ openPaneHard(paneId); }, 60);
    }
  }, true);

  document.addEventListener('click', function(e){
    var closeBtn = e.target && e.target.closest && e.target.closest('.close-pane-btn');
    if(closeBtn){
      window.__SUGO_SUPPRESS_OPEN_PANE = selectedTopicPaneId() || activePaneId() || '';
    }
  }, true);

  // Do not auto-open the currently selected topic on page load.
  // It was causing a topic to open by itself when the browser restored dropdown values.
  // لا نعيد فتح أي قسم تلقائياً عند تحميل الصفحة.

  window.SUGO_OPEN_SELECTED_TOPIC_NOW = repairSelectedTopicOpen;
  window.SUGO_HARD_OPEN_PANE = openPaneHard;
})();
