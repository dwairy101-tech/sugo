(function(){
  'use strict';
  if(window.__SUGO_DIRECT_SECTION_EDIT__) return;
  window.__SUGO_DIRECT_SECTION_EDIT__ = true;

  var WORKER_URL = window.SUGO_WORKER_URL || 'https://sugo.dwairy101.workers.dev';
  var paneOverrides = {};
  var originalPaneHtml = {};
  var editingPaneId = null;
  var editingOriginalHtml = '';

  function getAdminPassword(){
    if(window.__SUGO_ADMIN_PASSWORD) return window.__SUGO_ADMIN_PASSWORD;
    var password=prompt('Admin password');
    if(!password) return '';
    window.__SUGO_ADMIN_PASSWORD=password;
    return password;
  }
  function clearAdminPassword(password){
    if(window.__SUGO_ADMIN_PASSWORD && (!password || window.__SUGO_ADMIN_PASSWORD===password)) window.__SUGO_ADMIN_PASSWORD='';
  }

  function byId(id){ return document.getElementById(id); }
  function norm(v){ return String(v || '').replace(/\s+/g,' ').trim(); }
  function paneEl(id){ return byId('pane-' + id); }
  function activePane(){ return document.querySelector('.content-pane.active'); }
  function activePaneId(){ var p=activePane(); return p && p.id ? p.id.replace(/^pane-/,'') : (window.SUGO_ACTIVE_PANE || localStorage.getItem('sugo_last_pane') || ''); }
  function authHeader(password){ return 'Bearer ' + String(password || ''); }
  function toast(msg){
    var box=byId('sugoDirectToast');
    if(!box){ box=document.createElement('div'); box.id='sugoDirectToast'; box.className='sugo-direct-toast'; document.body.appendChild(box); }
    box.textContent=msg; box.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){ box.classList.remove('show'); }, 3200);
  }

  function getPaneStore(){
    if(window.paneContent) return window.paneContent;
    try{ if(typeof paneContent !== 'undefined') return paneContent; }catch(e){}
    return null;
  }

  function contentTarget(pane){
    if(!pane) return null;
    var existing = pane.querySelector(':scope > .sugo-direct-edit-target');
    if(existing) return existing;
    var kids = Array.prototype.slice.call(pane.children || []);
    var target = kids.find(function(el){
      return el && el.classList && !el.classList.contains('close-pane-btn') && !el.classList.contains('sugo-direct-edit-toolbar') && !el.classList.contains('sugo-inline-edit-toolbar');
    });
    if(target) target.classList.add('sugo-direct-edit-target');
    return target || null;
  }

  function hasOverride(id){ return !!(paneOverrides && paneOverrides[id] && paneOverrides[id].html); }

  function clean(root){
    if(!root) return '';
    root.querySelectorAll('[contenteditable]').forEach(function(el){ el.removeAttribute('contenteditable'); });
    root.querySelectorAll('.sugo-direct-edit-toolbar,.sugo-inline-edit-toolbar,.sugo-direct-toast,.sugo-inline-edit-hint').forEach(function(el){ el.remove(); });
    return root.innerHTML;
  }

  function applyOverrides(){
    var store = getPaneStore();
    if(!store) return;
    Object.keys(paneOverrides || {}).forEach(function(id){
      var row=paneOverrides[id];
      if(row && row.html && store[id]){
        if(!(id in originalPaneHtml)){
          originalPaneHtml[id] = (typeof store[id] === 'object') ? (store[id].en || store[id].html || '') : String(store[id] || '');
        }
        if(typeof store[id] === 'object') store[id].en = row.html;
        else store[id] = row.html;
        var rendered = paneEl(id);
        if(rendered && !rendered.classList.contains('active')) rendered.remove();
      }
    });
  }

  async function loadOverrides(){
    try{
      var res=await fetch(WORKER_URL + '/content?ts=' + Date.now(), {cache:'no-store'});
      var data=await res.json();
      if(data && data.ok && data.content && data.content.paneOverrides){
        paneOverrides=data.content.paneOverrides || {};
        applyOverrides();
      }
    }catch(e){ console.warn('SUGO edit: cannot load overrides', e); }
  }

  function injectEdit(id){
    id = id || activePaneId();
    if(!id) return;
    var pane = paneEl(id);
    if(!pane || !pane.classList.contains('active')) return;
    pane.querySelectorAll(':scope > .sugo-inline-edit-toolbar').forEach(function(x){ x.remove(); });
    if(pane.querySelector(':scope > .sugo-direct-edit-toolbar')) return;

    var toolbar=document.createElement('div');
    toolbar.className='sugo-direct-edit-toolbar';
    toolbar.innerHTML='<button type="button" class="sugo-direct-edit-btn">Edit</button>' +
      (hasOverride(id) ? '<button type="button" class="sugo-direct-reset-btn">Reset</button>' : '');

    var closeBtn=pane.querySelector(':scope > .close-pane-btn');
    if(closeBtn && closeBtn.nextSibling) pane.insertBefore(toolbar, closeBtn.nextSibling);
    else pane.insertBefore(toolbar, pane.firstChild);

    toolbar.querySelector('.sugo-direct-edit-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); startEdit(id); });
    var resetBtn=toolbar.querySelector('.sugo-direct-reset-btn');
    if(resetBtn) resetBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); resetPane(id); });
  }

  function startEdit(id){
    if(typeof window.SUGO_TINY_PLUS_EDIT_TOPIC === 'function'){
      try{
        if(window.SUGO_TINY_PLUS_EDIT_TOPIC(id)){
          return;
        }
      }catch(err){
        console.warn('SUGO topic modal edit failed, falling back to inline edit', err);
      }
    }

    var pane=paneEl(id), target=contentTarget(pane);
    if(!pane || !target){ toast('افتح Topic أولًا ثم اضغط Edit.'); return; }
    if(editingPaneId && editingPaneId !== id){ toast('احفظ أو ألغِ التعديل الحالي أولًا.'); return; }
    editingPaneId=id;
    editingOriginalHtml=target.innerHTML;
    target.setAttribute('contenteditable','true');
    target.focus();
    var toolbar=pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(toolbar){
      toolbar.innerHTML='<button type="button" class="sugo-direct-save-btn">Save</button>'+
        '<button type="button" class="sugo-direct-cancel-btn">Cancel</button>';
      toolbar.querySelector('.sugo-direct-save-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); savePane(id); });
      toolbar.querySelector('.sugo-direct-cancel-btn').addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); cancelEdit(id); });
    }
    toast('اكتب أو امسح مباشرة داخل المحتوى.');
  }

  function cancelEdit(id){
    var pane=paneEl(id), target=contentTarget(pane);
    if(target){ target.innerHTML=editingOriginalHtml; target.removeAttribute('contenteditable'); }
    editingPaneId=null; editingOriginalHtml='';
    var toolbar=pane && pane.querySelector(':scope > .sugo-direct-edit-toolbar');
    if(toolbar) toolbar.remove();
    injectEdit(id);
  }

  async function savePane(id){
    var pane=paneEl(id), target=contentTarget(pane);
    if(!target) return;
    var password=getAdminPassword();
    if(!password) return;
    var html=clean(target.cloneNode(true));
    var status=pane.querySelector('.sugo-direct-edit-status');
    if(status) status.textContent='Saving...';
    try{
      var res=await fetch(WORKER_URL + '/admin/pane', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':authHeader(password)},
        body:JSON.stringify({paneId:id, html:html})
      });
      var data=await res.json();
      if(!data.ok){ clearAdminPassword(password); alert('Save failed: ' + (data.error || 'Unknown error')); if(status) status.textContent='Save failed.'; return; }
      window.__SUGO_ADMIN_PASSWORD=password;
      paneOverrides[id]={html:html, updatedAt:data.updatedAt || new Date().toISOString()};
      var store=getPaneStore();
      if(store && store[id]){ if(typeof store[id] === 'object') store[id].en=html; else store[id]=html; }
      target.innerHTML=html; target.removeAttribute('contenteditable');
      editingPaneId=null; editingOriginalHtml='';
      var toolbar=pane.querySelector(':scope > .sugo-direct-edit-toolbar'); if(toolbar) toolbar.remove();
      injectEdit(id);
      toast('تم الحفظ بنجاح.');
    }catch(e){ console.error(e); alert('Connection failed.'); if(status) status.textContent='Connection failed.'; }
  }

  async function resetPane(id){
    var password=getAdminPassword();
    if(!password) return;
    if(!confirm('Reset this section to original content?')) return;
    try{
      var res=await fetch(WORKER_URL + '/admin/pane/reset', {method:'POST', headers:{'Content-Type':'application/json','Authorization':authHeader(password)}, body:JSON.stringify({paneId:id})});
      var data=await res.json();
      if(!data.ok){ clearAdminPassword(password); alert('Reset failed: ' + (data.error || 'Unknown error')); return; }
      window.__SUGO_ADMIN_PASSWORD=password;
      delete paneOverrides[id];
      var store=getPaneStore();
      var original=(id in originalPaneHtml) ? originalPaneHtml[id] : null;
      if(original !== null && store && store[id]){
        if(typeof store[id] === 'object') store[id].en=original; else store[id]=original;
      }
      var rendered=paneEl(id);
      if(rendered){
        var target=contentTarget(rendered);
        if(target && original !== null){ target.innerHTML=original; target.removeAttribute('contenteditable'); }
      }
      editingPaneId=null; editingOriginalHtml='';
      var toolbar=rendered && rendered.querySelector(':scope > .sugo-direct-edit-toolbar');
      if(toolbar) toolbar.remove();
      injectEdit(id);
      toast('تمت إعادة القسم للمحتوى الأصلي.');
    }catch(e){ alert('Connection failed.'); }
  }

  function findTopicByCurrentSelect(){
    var topicSelect=byId('sugoCascadeTopic');
    if(!topicSelect || !topicSelect.value) return null;
    var opt=topicSelect.options[topicSelect.selectedIndex];
    var label=norm(opt && opt.textContent);
    if(!label) return null;
    var sectionSelect=byId('sugoCascadeSection');
    var sectionLabel=norm(sectionSelect && sectionSelect.options[sectionSelect.selectedIndex] && sectionSelect.options[sectionSelect.selectedIndex].textContent);
    var candidates=Array.prototype.slice.call(document.querySelectorAll('.nav-l000-btn')).filter(function(btn){ return norm(btn.textContent) === label; });
    if(sectionLabel){
      var bySection=candidates.filter(function(btn){
        var sec=btn.closest('.nav-l00');
        var secBtn=sec && sec.querySelector('.nav-l00-btn span');
        return norm(secBtn && secBtn.textContent) === sectionLabel;
      });
      if(bySection.length) candidates=bySection;
    }
    return candidates[0] || null;
  }

  function forceOpenSelectedTopic(){
    var topicBtn=findTopicByCurrentSelect();
    if(!topicBtn) return;
    var id=topicBtn.getAttribute('data-pane');
    if(id && typeof window.showPane === 'function'){
      window.showPane(id, true);
      setTimeout(function(){ injectEdit(id); }, 80);
    }
  }

  function wrapShowPane(){
    var original=window.showPane;
    if(typeof original !== 'function' || original.__sugoDirectWrapped) return;
    window.showPane=function(paneId, save){
      var out=original.apply(this, arguments);
      setTimeout(function(){ injectEdit(paneId); }, 60);
      return out;
    };
    window.showPane.__sugoDirectWrapped=true;
  }

  function install(){
    wrapShowPane();
    loadOverrides().then(function(){
      wrapShowPane();
      // Do not auto-open a selected topic after /content finishes loading.
      // Sections should open only from a real user change/click.
      injectEdit(activePaneId());
    });

    document.addEventListener('change', function(e){
      if(e.target && e.target.id === 'sugoCascadeTopic') setTimeout(forceOpenSelectedTopic, 30);
    }, true);
    document.addEventListener('click', function(e){
      var t=e.target && e.target.closest && e.target.closest('.nav-l000-btn');
      if(t){ var id=t.getAttribute('data-pane'); setTimeout(function(){ injectEdit(id); }, 80); }
    }, true);
    var obs=new MutationObserver(function(){ var id=activePaneId(); if(id) setTimeout(function(){ injectEdit(id); }, 80); });
    obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
    setInterval(function(){ wrapShowPane(); var id=activePaneId(); if(id) injectEdit(id); }, 1200);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
