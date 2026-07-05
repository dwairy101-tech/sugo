// Extracted from index(94).html: <script id="sugo-robust-content-language-dropdown-fix-js">
(function(){
  'use strict';
  if(window.__SUGO_ROBUST_CONTENT_LANGUAGE_DROPDOWN_FIX__) return;
  window.__SUGO_ROBUST_CONTENT_LANGUAGE_DROPDOWN_FIX__ = true;

  var LANG_LABELS = { all:'All', en:'English', ar:'Arabic' };
  var TYPE_LABELS = {
    all:'All', answer:'Answer', ticket:'Ticket', text:'Text', form:'Form', mention:'Mention',
    escalation:'Escalation', internal:'Internal', overview:'Overview', usecase:'Use Case', checklist:'Required Info', flow:'Steps'
  };
  var TYPE_ORDER = ['all','answer','ticket','text','form','mention','escalation','internal','checklist','overview','usecase','flow'];

  function qsa(root, selector){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[c]; }); }
  function uniq(values){
    var out=[], seen=Object.create(null);
    (values || []).forEach(function(v){ v=String(v || '').trim(); if(v && !seen[v]){ seen[v]=true; out.push(v); } });
    return out;
  }
  function orderedTypes(values){
    return uniq(values).sort(function(a,b){
      var ia=TYPE_ORDER.indexOf(a); if(ia<0) ia=999;
      var ib=TYPE_ORDER.indexOf(b); if(ib<0) ib=999;
      return ia-ib || a.localeCompare(b);
    });
  }
  function optionLabel(group, value){ return (group === 'lang' ? LANG_LABELS[value] : TYPE_LABELS[value]) || value; }
  function optionHtml(group, values, selected){
    return values.map(function(v){ return '<option value="'+esc(v)+'"'+(v===selected?' selected':'')+'>'+esc(optionLabel(group,v))+'</option>'; }).join('');
  }
  function values(card, group){
    var attr = group === 'lang' ? 'data-lang' : 'data-type';
    var list = qsa(card, '.sugo-section').map(function(section){ return section.getAttribute(attr) || (group === 'lang' ? 'all' : 'text'); });
    list = group === 'type' ? orderedTypes(list) : uniq(list);
    if(list.length > 1 && list.indexOf('all') === -1) list.unshift('all');
    return list.length ? list : ['all'];
  }
  function setHiddenButton(card, group, value){
    var controls = card && card.querySelector('.sugo-view-controls');
    if(!controls) return;
    var btn = controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="'+value+'"]') ||
      controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"][data-value="all"]') ||
      controls.querySelector('.sugo-view-btn[data-filter-group="'+group+'"]');
    qsa(controls, '.sugo-view-btn[data-filter-group="'+group+'"]').forEach(function(b){ b.classList.remove('active'); });
    if(btn) btn.classList.add('active');
  }
  function activeValue(card, group){
    var panel = card && (card.querySelector(':scope > .sugo-min-filter-panel') || card.querySelector('.sugo-min-filter-panel'));
    var sel = panel ? panel.querySelector('select[data-sugo-min="'+group+'"]') : null;
    if(sel && sel.value) return sel.value;
    var controls = card && card.querySelector('.sugo-view-controls');
    var active = controls ? controls.querySelector('.sugo-view-btn.active[data-filter-group="'+group+'"]') : null;
    if(active) return active.getAttribute('data-value') || 'all';
    try { return localStorage.getItem('sugo_content_filter_' + group) || 'all'; } catch(e) { return 'all'; }
  }
  function ensurePanel(card){
    if(!card || !card.querySelector('.sugo-section')) return null;
    var panel = card.querySelector(':scope > .sugo-min-filter-panel') || card.querySelector('.sugo-min-filter-panel');
    if(panel) return panel;
    panel = document.createElement('div');
    panel.className = 'sugo-min-filter-panel';
    panel.innerHTML = '<div class="sugo-min-filter-row">'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Copy</span><button type="button" class="sugo-min-copy-btn" data-sugo-min="copy">Copy</button></label>'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Content</span><select class="sugo-min-select" data-sugo-min="type"></select></label>'+
      '<label class="sugo-min-field"><span class="sugo-min-label">Language</span><select class="sugo-min-select" data-sugo-min="lang"></select></label>'+
      '</div>';
    var before = card.querySelector('.sugo-view-controls') || card.firstChild;
    card.insertBefore(panel, before);
    return panel;
  }
  function sync(card){
    var panel = ensurePanel(card);
    if(!panel) return;
    var langVals = values(card, 'lang');
    var typeVals = values(card, 'type');
    var langActive = activeValue(card, 'lang');
    var typeActive = activeValue(card, 'type');
    if(langVals.indexOf(langActive) < 0) langActive = langVals.indexOf('all') >= 0 ? 'all' : langVals[0];
    if(typeVals.indexOf(typeActive) < 0) typeActive = typeVals.indexOf('all') >= 0 ? 'all' : typeVals[0];
    var langSel = panel.querySelector('select[data-sugo-min="lang"]');
    var typeSel = panel.querySelector('select[data-sugo-min="type"]');
    if(langSel){ langSel.innerHTML = optionHtml('lang', langVals, langActive); langSel.value = langActive; langSel.disabled = langVals.length <= 1; }
    if(typeSel){ typeSel.innerHTML = optionHtml('type', typeVals, typeActive); typeSel.value = typeActive; typeSel.disabled = typeVals.length <= 1; }
    setHiddenButton(card, 'lang', langActive);
    setHiddenButton(card, 'type', typeActive);
  }
  function apply(card){
    if(!card) return;
    var lang = activeValue(card, 'lang');
    var type = activeValue(card, 'type');
    setHiddenButton(card, 'lang', lang);
    setHiddenButton(card, 'type', type);
    var visible = 0;
    qsa(card, '.sugo-section').forEach(function(section){
      var sl = section.getAttribute('data-lang') || 'all';
      var st = section.getAttribute('data-type') || 'text';
      var show = (lang === 'all' || sl === 'all' || sl === lang) && (type === 'all' || st === type);
      section.classList.toggle('content-filtered-hidden', !show);
      if(show) visible++;
    });
    qsa(card, '.macro-col').forEach(function(col){
      var sections = qsa(col, '.sugo-section');
      if(!sections.length) return;
      var hasVisible = sections.some(function(s){ return !s.classList.contains('content-filtered-hidden'); });
      col.classList.toggle('sugo-col-hidden', !hasVisible);
    });
    qsa(card, '.macro-grid').forEach(function(grid){
      var count = qsa(grid, '.macro-col').filter(function(col){ return !col.classList.contains('sugo-col-hidden'); }).length;
      grid.classList.toggle('sugo-single-col', count === 1);
    });
    qsa(card, '.sugo-internal-panel').forEach(function(panel){
      var hasVisible = qsa(panel, '.sugo-section').some(function(s){ return !s.classList.contains('content-filtered-hidden'); });
      panel.classList.toggle('sugo-panel-hidden', !hasVisible);
    });
    var empty = card.querySelector('.sugo-filter-empty');
    if(empty) empty.style.display = visible ? 'none' : 'block';
  }
  function initCard(card){
    if(!card || !card.querySelector('.sugo-section')) return;
    ensurePanel(card);
    sync(card);
    apply(card);
  }
  function refresh(scope){ qsa(scope || document, '.doc-card').forEach(initCard); }

  window.sugoApplyContentVisibility = apply;
  window.SUGO_FORCE_FILTER_REFRESH = function(){ refresh(document); };

  document.addEventListener('change', function(event){
    var sel = event.target && event.target.closest && event.target.closest('.sugo-min-filter-panel select[data-sugo-min]');
    if(!sel) return;
    var group = sel.getAttribute('data-sugo-min');
    if(group !== 'lang' && group !== 'type') return;
    var card = sel.closest('.doc-card');
    if(!card) return;
    try { localStorage.setItem('sugo_content_filter_' + group, sel.value); } catch(e) {}
    setHiddenButton(card, group, sel.value);
    apply(card);
    setTimeout(function(){ sync(card); apply(card); }, 0);
    setTimeout(function(){ sync(card); apply(card); }, 80);
  }, true);

  var oldShowPane = window.showPane;
  if(typeof oldShowPane === 'function' && !oldShowPane.__sugoFilterFixWrapped){
    var wrappedShowPane = function(){
      var result = oldShowPane.apply(this, arguments);
      setTimeout(function(){ refresh(document); }, 0);
      setTimeout(function(){ refresh(document); }, 120);
      return result;
    };
    wrappedShowPane.__sugoFilterFixWrapped = true;
    window.showPane = wrappedShowPane;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ refresh(document); });
  else refresh(document);
  setTimeout(function(){ refresh(document); }, 150);
  setTimeout(function(){ refresh(document); }, 600);
  try{
    new MutationObserver(function(records){
      var needs = false;
      records.forEach(function(record){ if(record.addedNodes && record.addedNodes.length) needs = true; });
      if(needs) setTimeout(function(){ refresh(document); }, 30);
    }).observe(document.body, { childList:true, subtree:true });
  }catch(e){}
})();
