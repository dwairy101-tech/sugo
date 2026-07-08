(function(){
  function byId(id){ return document.getElementById(id); }
  function hasVisionImage(){
    try{ return typeof sugoAiAttachedImage !== 'undefined' && !!sugoAiAttachedImage; }
    catch(e){ return false; }
  }
  function keepAnalyzeButtonVisible(){
    var panel = byId('sugoVisionWorkspace');
    var btn = byId('sugoVisionSubmit');
    if(panel){ panel.classList.toggle('sugo-has-vision-image', hasVisionImage()); }
    if(btn){
      btn.hidden = false;
      btn.removeAttribute('hidden');
      btn.style.display = 'inline-flex';
      btn.style.visibility = 'visible';
      btn.style.opacity = '1';
      btn.disabled = false;
    }
  }

  function wrapAsync(name){
    var original = window[name];
    if(typeof original !== 'function') return;
    window[name] = async function(){
      var result;
      try{ result = await original.apply(this, arguments); }
      finally{
        keepAnalyzeButtonVisible();
        setTimeout(keepAnalyzeButtonVisible, 60);
        setTimeout(keepAnalyzeButtonVisible, 260);
      }
      return result;
    };
  }
  function wrapSync(name){
    var original = window[name];
    if(typeof original !== 'function') return;
    window[name] = function(){
      var result = original.apply(this, arguments);
      keepAnalyzeButtonVisible();
      setTimeout(keepAnalyzeButtonVisible, 60);
      return result;
    };
  }

  wrapSync('sugoOpenVisionWorkspace');
  wrapAsync('sugoHandleVisionWorkspaceImage');
  wrapSync('sugoVisionClearWorkspace');
  wrapSync('clearSugoVisionImage');

  document.addEventListener('change', function(e){
    if(e.target && e.target.id === 'sugoVisionWorkspaceInput'){
      setTimeout(keepAnalyzeButtonVisible, 120);
      setTimeout(keepAnalyzeButtonVisible, 600);
    }
  }, true);
  document.addEventListener('click', function(e){
    if(e.target && (e.target.id === 'sugoVisionSubmit' || e.target.closest('#sugoVisionSubmit'))){
      keepAnalyzeButtonVisible();
    }
  }, true);

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', keepAnalyzeButtonVisible);
  }else{
    keepAnalyzeButtonVisible();
  }
})();
