(function(){
  'use strict';
  if(window.__SUGO_CURRENT_TOPIC_CONTENT_EDITOR__) return;
  window.__SUGO_CURRENT_TOPIC_CONTENT_EDITOR__ = true;

  function byId(id){ return document.getElementById(id); }
  function cssEscape(value){
    try{ return CSS && CSS.escape ? CSS.escape(String(value || '')) : String(value || '').replace(/[^a-zA-Z0-9_-]/g,'\\$&'); }
    catch(e){ return String(value || '').replace(/[^a-zA-Z0-9_-]/g,'\\$&'); }
  }
  function activePane(){ return document.querySelector('.content-pane.active'); }
  function activePaneId(){
    var pane = activePane();
    if(pane && pane.id) return pane.id.replace(/^pane-/, '');
    return window.SUGO_ACTIVE_PANE || '';
  }
  function topicButtonForPane(paneId){
    if(!paneId) return null;
    return document.querySelector('.nav-l000-btn[data-pane="' + cssEscape(paneId) + '"]');
  }
  function hasEditableTopic(paneId){
    if(!paneId) return false;
    if(topicButtonForPane(paneId)) return true;
    try{ return !!(window.paneContent && window.paneContent[paneId]); }catch(e){ return false; }
  }
  function ensureAdminPassword(){
    if(window.__SUGO_ADMIN_PASSWORD) return true;
    var password = prompt('Admin password');
    if(!password) return false;
    window.__SUGO_ADMIN_PASSWORD = password;
    document.body.classList.add('sugo-admin-menu-on');
    return true;
  }
  function toast(message){
    var old = byId('sugoCurrentTopicEditToast');
    if(!old){
      old = document.createElement('div');
      old.id = 'sugoCurrentTopicEditToast';
      old.className = 'sugo-direct-toast';
      document.body.appendChild(old);
    }
    old.textContent = message;
    old.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ old.classList.remove('show'); }, 3200);
  }
  function openCurrentTopicEditor(paneId){
    paneId = paneId || activePaneId();
    if(!paneId){ toast('افتح التوبك أولًا ثم اضغط تعديل.'); return; }
    if(!ensureAdminPassword()) return;

    function run(){
      if(typeof window.SUGO_TINY_PLUS_EDIT_TOPIC === 'function'){
        try{
          var opened = window.SUGO_TINY_PLUS_EDIT_TOPIC(paneId);
          if(opened !== false) return;
        }catch(err){ console.warn('SUGO current topic editor failed', err); }
      }
      toast('لم أستطع فتح محرر التوبك. تأكد أن التوبك موجود بالقائمة ثم جرّب مرة ثانية.');
    }

    if(typeof window.SUGO_TINY_PLUS_EDIT_TOPIC !== 'function') setTimeout(run, 350);
    else run();
  }
  function makeButton(paneId){
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sugo-admin-current-topic-edit-btn';
    btn.setAttribute('data-sugo-current-topic-edit', paneId);
    btn.textContent = 'Edit Current Topic';
    btn.title = 'Edit the currently opened topic content';
    return btn;
  }
  function ensureTopToolbar(pane, paneId){
    var toolbar = pane.querySelector(':scope > .sugo-admin-current-topic-toolbar');
    if(!toolbar){
      toolbar = document.createElement('div');
      toolbar.className = 'sugo-admin-current-topic-toolbar';
      var closeBtn = pane.querySelector(':scope > .close-pane-btn');
      if(closeBtn && closeBtn.nextSibling) pane.insertBefore(toolbar, closeBtn.nextSibling);
      else pane.insertBefore(toolbar, pane.firstChild);
    }
    var btn = toolbar.querySelector('[data-sugo-current-topic-edit]');
    if(!btn){
      btn = makeButton(paneId);
      toolbar.appendChild(btn);
    }else{
      btn.setAttribute('data-sugo-current-topic-edit', paneId);
    }
  }
  function ensureCardButton(pane, paneId){
    var cardbar = pane.querySelector('.doc-card > .sugo-fr-cardbar');
    if(!cardbar) return;
    var btn = cardbar.querySelector('[data-sugo-current-topic-edit]');
    if(!btn){
      btn = makeButton(paneId);
      cardbar.appendChild(btn);
    }else{
      btn.setAttribute('data-sugo-current-topic-edit', paneId);
    }
  }
  function sync(){
    var pane = activePane();
    var paneId = activePaneId();
    if(!pane || !hasEditableTopic(paneId)) return;
    ensureTopToolbar(pane, paneId);
    ensureCardButton(pane, paneId);
  }

  document.addEventListener('click', function(event){
    var btn = event.target && event.target.closest && event.target.closest('[data-sugo-current-topic-edit]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    openCurrentTopicEditor(btn.getAttribute('data-sugo-current-topic-edit') || activePaneId());
  }, true);

  var originalShowPane = window.showPane;
  if(typeof originalShowPane === 'function' && !originalShowPane.__sugoCurrentTopicEditorWrapped){
    var wrapped = function(){
      var result = originalShowPane.apply(this, arguments);
      setTimeout(sync, 0);
      setTimeout(sync, 120);
      setTimeout(sync, 450);
      return result;
    };
    wrapped.__sugoCurrentTopicEditorWrapped = true;
    window.showPane = wrapped;
    try{ showPane = window.showPane; }catch(e){}
  }

  document.addEventListener('click', function(event){
    if(event.target && event.target.closest && event.target.closest('.nav-l000-btn,[data-sugo-fr-open]')){
      setTimeout(sync, 80);
      setTimeout(sync, 220);
    }
  }, true);
  document.addEventListener('change', function(event){
    if(event.target && event.target.id === 'sugoCascadeTopic'){
      setTimeout(sync, 100);
      setTimeout(sync, 320);
    }
  }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ setTimeout(sync, 150); });
  else setTimeout(sync, 150);
  window.addEventListener('load', function(){ setTimeout(sync, 250); setTimeout(sync, 900); });
  // v6 performance: no full-body MutationObserver / interval for current-topic editor.
  // showPane and nav click hooks already sync the edit button.

  window.SUGOCurrentTopicContentEditor = { sync: sync, open: openCurrentTopicEditor };
})();
