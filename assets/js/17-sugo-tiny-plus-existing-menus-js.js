// Extracted from index(94).html: <script id="sugo-tiny-plus-existing-menus-js">
(function(){
  'use strict';

  var WORKER_URL = window.SUGO_WORKER_URL || 'https://sugo.dwairy101.workers.dev';
  var CACHE_KEY = 'sugo_integrated_menu_v1_cache';
  var menuState = { version:1, updatedAt:null, items:[] };
  var CTRL_RENAME='__rename__';
  var CTRL_DELETE='__delete__';
  var adminMode=!!window.__SUGO_ADMIN_PASSWORD;
  var adminPassword=window.__SUGO_ADMIN_PASSWORD || '';

  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c];}); }
  function attr(v){ return esc(v).replace(/`/g,'&#096;'); }
  function directChildren(parent, selector){ return parent ? Array.prototype.filter.call(parent.children,function(c){ return c.matches && c.matches(selector); }) : []; }
  function cleanText(v, n){ return String(v == null ? '' : v).replace(/\u0000/g,'').trim().slice(0,n||30000); }
  function textOf(el){
    var sp=el?el.querySelector('span'):null;
    return (sp?sp.textContent:(el?el.textContent:'' )).replace(/\s+/g,' ').trim();
  }
  function setText(el, value){
    if(!el) return;
    var sp=el.querySelector && el.querySelector('span');
    if(sp) sp.textContent=value;
    else el.textContent=value;
  }
  function slug(v, prefix){
    var s=String(v||'').toLowerCase().trim().replace(/[^a-z0-9\u0600-\u06ff_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
    return (prefix||'x')+'-'+(s||Date.now().toString(36))+'-'+Math.random().toString(36).slice(2,6);
  }
  function authHeader(password){ return 'Bearer ' + String(password || '').trim(); }
  function isControlItem(item){ return item && (item.rootKey===CTRL_RENAME || item.rootKey===CTRL_DELETE); }
  function cleanState(x){
    x=x&&typeof x==='object'?x:{};
    var seen={};
    var items=Array.isArray(x.items)?x.items.filter(function(item){
      if(!item || typeof item!=='object') return false;
      var id=String(item.id||item.paneId||'');
      if(!id || seen[id]) return false;
      seen[id]=true;
      return ['root','category','section','topic'].indexOf(String(item.type||''))!==-1;
    }):[];
    return { version:1, updatedAt:x.updatedAt||null, items:items };
  }
  function readCache(){ try{ return cleanState(JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')); }catch(e){ return cleanState({}); } }
  function writeCache(state){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify(cleanState(state))); }catch(e){} }
  function sameState(a,b){ try{ return JSON.stringify(cleanState(a))===JSON.stringify(cleanState(b)); }catch(e){ return false; } }

  function rootKey(root){
    if(!root) return '';
    if(root.dataset && root.dataset.sugoRootKey) return root.dataset.sugoRootKey;
    var txt=root.textContent||'';
    if(root.querySelector && (root.querySelector('#rootSVTickets') || /SUGO\s*SV|Tickets\s*&\s*Macros|Organized\s*Support\s*Macros/i.test(txt))){
      root.dataset.sugoRootKey='sv';
      return 'sv';
    }
    root.dataset.sugoRootKey='kb';
    return 'kb';
  }
  function catKey(cat){ var b=cat&&cat.querySelector('.nav-l0-btn'); return b ? (b.getAttribute('data-l0') || textOf(b)) : ''; }
  function secKey(sec){ var b=sec&&sec.querySelector('.nav-l00-btn'); return b ? (b.getAttribute('data-l00') || textOf(b)) : ''; }
  function topicKey(topic){ return topic ? (topic.getAttribute('data-pane') || textOf(topic)) : ''; }

  function cssEsc(v){
    v=String(v||'');
    if(window.CSS && CSS.escape) return CSS.escape(v);
    return v.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
  }

  function makePaneHtml(title, body){
    var parts=String(body||'').split(/\r?\n/).map(function(line){
      line=line.trim();
      return line ? '<p>'+esc(line)+'</p>' : '<br>';
    }).join('');
    return '<div class="doc-card" data-sugo-custom-topic="1"><div class="macro-grid"><div class="macro-col" dir="rtl"><h2 class="macro-title">'+esc(title)+'</h2><div class="macro-body">'+(parts||'<p></p>')+'</div></div></div></div>';
  }

  function findRoot(key){
    var nav=byId('sidebarNav');
    var roots=directChildren(nav,'.nav-lroot');
    return roots.find(function(r){return rootKey(r)===key;}) || null;
  }
  function findCategory(root,key){ return directChildren(root&&root.querySelector('.nav-lroot-children'),'.nav-l0').find(function(c){return catKey(c)===key;}) || null; }
  function findSection(cat,key){ return directChildren(cat&&cat.querySelector('.nav-l0-children'),'.nav-l00').find(function(s){return secKey(s)===key;}) || null; }
  function findTopic(sec,key){ return directChildren(sec&&sec.querySelector('.nav-l00-children'),'.nav-l000-btn').find(function(t){return topicKey(t)===key;}) || null; }
  function findDomTarget(level, key){
    var nav=byId('sidebarNav');
    if(!nav || !key) return null;
    if(level==='root') return findRoot(key);
    if(level==='category'){
      var b=nav.querySelector('.nav-l0-btn[data-l0="'+cssEsc(key)+'"]');
      return b ? b.closest('.nav-l0') : null;
    }
    if(level==='section'){
      var s=nav.querySelector('.nav-l00-btn[data-l00="'+cssEsc(key)+'"]');
      return s ? s.closest('.nav-l00') : null;
    }
    if(level==='topic') return nav.querySelector('.nav-l000-btn[data-pane="'+cssEsc(key)+'"]');
    return null;
  }
  function targetButton(level, el){
    if(!el) return null;
    if(level==='root') return el.querySelector('.nav-lroot-btn');
    if(level==='category') return el.querySelector('.nav-l0-btn');
    if(level==='section') return el.querySelector('.nav-l00-btn');
    if(level==='topic') return el;
    return null;
  }

  function controlId(kind, level, key){ return 'ctl-'+kind+'-'+level+'-'+String(key||'').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]+/g,'-').slice(0,120); }
  function findControl(kind, level, key){
    return (menuState.items||[]).find(function(item){ return item && item.rootKey===kind && item.categoryKey===level && item.sectionKey===key; }) || null;
  }
  function removeControl(kind, level, key){
    menuState.items=(menuState.items||[]).filter(function(item){ return !(item && item.rootKey===kind && item.categoryKey===level && item.sectionKey===key); });
  }
  function isDeleted(level,key){ return Boolean(findControl(CTRL_DELETE, level, key)); }
  function renameFor(level,key){ var item=findControl(CTRL_RENAME, level, key); return item ? item.label : null; }
  function setRename(level,key,label){
    removeControl(CTRL_RENAME, level, key);
    menuState.items.push({type:level,id:controlId('rename',level,key),label:label,rootKey:CTRL_RENAME,categoryKey:level,sectionKey:key,paneId:key,updatedAt:new Date().toISOString()});
  }
  function setDelete(level,key){
    removeControl(CTRL_DELETE, level, key);
    removeControl(CTRL_RENAME, level, key);
    menuState.items.push({type:level,id:controlId('delete',level,key),label:'',rootKey:CTRL_DELETE,categoryKey:level,sectionKey:key,paneId:key,updatedAt:new Date().toISOString()});
  }

  function ensureLibraryOption(rootId, label){
    var select=byId('sugoLibrarySelect');
    if(!select || !rootId) return;
    var opt=select.querySelector('option[value="'+cssEsc(rootId)+'"]');
    if(!opt){
      opt=document.createElement('option');
      opt.value=rootId;
      select.appendChild(opt);
    }
    opt.textContent=label || rootId;
  }

  function applyRenamesAndDeletes(){
    menuState=cleanState(menuState);
    (menuState.items||[]).forEach(function(item){
      if(!isControlItem(item)) return;
      var level=item.categoryKey;
      var key=item.sectionKey || item.paneId;
      var el=findDomTarget(level,key);
      if(!el) return;
      if(item.rootKey===CTRL_DELETE){
        if(level==='root'){
          var sel=byId('sugoLibrarySelect');
          if(sel){ var opt=sel.querySelector('option[value="'+cssEsc(key)+'"]'); if(opt) opt.remove(); }
        }
        el.remove();
        return;
      }
      if(item.rootKey===CTRL_RENAME){
        setText(targetButton(level,el), item.label || 'Untitled');
        if(level==='root') ensureLibraryOption(key, item.label || 'Untitled');
      }
    });
  }

  function createRoot(item){
    var nav=byId('sidebarNav');
    if(!nav || isControlItem(item) || isDeleted('root', item.id)) return null;
    var existing=findRoot(item.id);
    if(existing){ setText(existing.querySelector('.nav-lroot-btn'), item.label || 'New Menu'); ensureLibraryOption(item.id, item.label); return existing; }
    var root=document.createElement('div');
    root.className='nav-lroot';
    root.dataset.sugoRootKey=item.id;
    root.dataset.sugoCustom='1';
    root.dataset.sugoCustomRoot='1';
    root.innerHTML='<button class="nav-lroot-btn" type="button"><div class="nav-lroot-star">★</div><span>'+esc(item.label||'New Menu')+'</span><div class="nav-lroot-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-lroot-children"></div>';
    nav.appendChild(root);
    ensureLibraryOption(item.id, item.label||'New Menu');
    return root;
  }

  function createCategory(root,item){
    if(isControlItem(item) || isDeleted('category', item.id)) return null;
    var wrap=root&&root.querySelector('.nav-lroot-children');
    if(!wrap) return null;
    var existing=findCategory(root,item.id);
    if(existing){ setText(existing.querySelector('.nav-l0-btn'), item.label || 'New Category'); return existing; }
    var div=document.createElement('div');
    div.className='nav-l0';
    div.dataset.sugoCustom='1';
    div.innerHTML='<button class="nav-l0-btn" type="button" data-l0="'+attr(item.id)+'"><div class="nav-l0-dot"></div><span>'+esc(item.label||'New Category')+'</span><div class="nav-l0-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-l0-children"></div>';
    wrap.appendChild(div);
    return div;
  }

  function createSection(cat,item){
    if(isControlItem(item) || isDeleted('section', item.id)) return null;
    var wrap=cat&&cat.querySelector('.nav-l0-children');
    if(!wrap) return null;
    var existing=findSection(cat,item.id);
    if(existing){ setText(existing.querySelector('.nav-l00-btn'), item.label || 'New Section'); return existing; }
    var div=document.createElement('div');
    div.className='nav-l00';
    div.dataset.sugoCustom='1';
    div.innerHTML='<button class="nav-l00-btn" type="button" data-l00="'+attr(item.id)+'"><div class="nav-l00-indicator"></div><span>'+esc(item.label||'New Section')+'</span><div class="nav-l00-chev"><svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg></div></button><div class="nav-l00-children"></div>';
    wrap.appendChild(div);
    return div;
  }

  function createTopic(sec,item){
    if(isControlItem(item) || isDeleted('topic', item.paneId || item.id)) return null;
    var wrap=sec&&sec.querySelector('.nav-l00-children');
    if(!wrap) return null;
    var paneId=item.paneId||item.id;
    var existing=wrap.querySelector('.nav-l000-btn[data-pane="'+cssEsc(paneId)+'"]');
    if(existing){
      existing.textContent=item.label||'New Topic';
      if(typeof window.setPane==='function') window.setPane(paneId, item.html || makePaneHtml(item.label,item.body||''));
      return existing;
    }

    var btn=document.createElement('button');
    btn.type='button';
    btn.className='nav-l000-btn';
    btn.dataset.sugoCustom='1';
    btn.setAttribute('data-pane', paneId);
    btn.textContent=item.label||'New Topic';
    wrap.appendChild(btn);

    if(typeof window.setPane==='function'){
      window.setPane(paneId, item.html || makePaneHtml(item.label,item.body||''));
    }
    return btn;
  }

  function applyMenu(state){
    state=cleanState(state);
    menuState=state;
    applyRenamesAndDeletes();
    state.items.forEach(function(item){ if(item.type==='root' && !isControlItem(item)) createRoot(item); });
    state.items.forEach(function(item){ if(item.type==='category' && !isControlItem(item)){ var r=findRoot(item.rootKey); if(r) createCategory(r,item); }});
    state.items.forEach(function(item){ if(item.type==='section' && !isControlItem(item)){ var r=findRoot(item.rootKey), c=findCategory(r,item.categoryKey); if(c) createSection(c,item); }});
    state.items.forEach(function(item){ if(item.type==='topic' && !isControlItem(item)){ var r=findRoot(item.rootKey), c=findCategory(r,item.categoryKey), s=findSection(c,item.sectionKey); if(s) createTopic(s,item); }});
    applyRenamesAndDeletes();
  }

  function currentRootFromSelect(){
    var nav=byId('sidebarNav');
    var lib=byId('sugoLibrarySelect');
    if(!nav || !lib || !lib.value) return null;
    if(lib.value==='kb') return directChildren(nav,'.nav-lroot').find(function(r){return rootKey(r)==='kb';}) || null;
    if(lib.value==='sv') return directChildren(nav,'.nav-lroot').find(function(r){return rootKey(r)==='sv';}) || null;
    return findRoot(lib.value);
  }

  function currentFilteredTopics(section){
    var topicFilter=byId('sugoCascadeTopicSearch');
    var filter=(topicFilter && topicFilter.value || '').toLowerCase().trim();
    var topics=directChildren(section&&section.querySelector('.nav-l00-children'),'.nav-l000-btn');
    return topics.filter(function(btn){ return !filter || (btn.textContent||'').toLowerCase().indexOf(filter)!==-1; });
  }

  function getPath(){
    var root=currentRootFromSelect();
    var catSel=byId('sugoCascadeCategory');
    var secSel=byId('sugoCascadeSection');
    var cats=directChildren(root&&root.querySelector('.nav-lroot-children'),'.nav-l0');
    var category=cats[Number(catSel&&catSel.value)];
    var secs=directChildren(category&&category.querySelector('.nav-l0-children'),'.nav-l00');
    var section=secs[Number(secSel&&secSel.value)];
    return {root:root||null, category:category||null, section:section||null};
  }

  function getSelectedTarget(level){
    var path=getPath();
    if(level==='root'){
      if(!path.root) return null;
      return {level:'root', key:rootKey(path.root), el:path.root, label:textOf(path.root.querySelector('.nav-lroot-btn'))};
    }
    if(level==='category'){
      if(!path.category) return null;
      return {level:'category', key:catKey(path.category), el:path.category, label:textOf(path.category.querySelector('.nav-l0-btn'))};
    }
    if(level==='section'){
      if(!path.section) return null;
      return {level:'section', key:secKey(path.section), el:path.section, label:textOf(path.section.querySelector('.nav-l00-btn'))};
    }
    if(level==='topic'){
      if(!path.section) return null;
      var topicSel=byId('sugoCascadeTopic');
      var topics=currentFilteredTopics(path.section);
      var topic=topics[Number(topicSel&&topicSel.value)];
      if(!topic) return null;
      return {level:'topic', key:topicKey(topic), el:topic, label:textOf(topic)};
    }
    return null;
  }

  async function postMenuWithPassword(password){
    var res=await fetch(WORKER_URL+'/admin/menu',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':authHeader(password)},
      body:JSON.stringify({menu:menuState})
    });
    var data=await res.json().catch(function(){return {};});
    return { ok: !!(res.ok && data && data.ok), status: res.status, data: data };
  }

  async function unlockAdmin(){
    if(adminMode && adminPassword) return true;
    if(window.__SUGO_ADMIN_PASSWORD){
      adminPassword=window.__SUGO_ADMIN_PASSWORD;
      adminMode=true;
      document.body.classList.add('sugo-admin-menu-on');
      return true;
    }
    var password=prompt('Admin password');
    if(!password) return false;
    var test=await postMenuWithPassword(password);
    if(!test.ok){
      if(window.__SUGO_ADMIN_PASSWORD===password) window.__SUGO_ADMIN_PASSWORD='';
      alert('Wrong password or admin unlock failed: '+((test.data&&test.data.error)||test.status));
      return false;
    }
    adminPassword=password;
    window.__SUGO_ADMIN_PASSWORD=password;
    adminMode=true;
    document.body.classList.add('sugo-admin-menu-on');
    return true;
  }

  async function saveMenu(){
    if(!adminMode || !adminPassword){
      var unlocked=await unlockAdmin();
      if(!unlocked) return false;
    }
    var result=await postMenuWithPassword(adminPassword);
    if(!result.ok){
      alert('Save failed: '+((result.data&&result.data.error)||result.status));
      adminMode=false;
      adminPassword='';
      window.__SUGO_ADMIN_PASSWORD='';
      document.body.classList.remove('sugo-admin-menu-on');
      return false;
    }
    writeCache(menuState);
    return true;
  }

  function refreshMenuAfterChange(paneId){
    writeCache(menuState);
    applyMenu(menuState);
    installTinyButtons();
    if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.refreshMenuDom === 'function'){
      window.SugoApp.navigation.refreshMenuDom({paneId:paneId || ''});
    }
  }

  var TOPIC_META_PREFIX='__SUGO_TOPIC_META__:';

  function packTopicMeta(meta){
    try { return TOPIC_META_PREFIX + JSON.stringify(meta || {}); }
    catch(e){ return ''; }
  }

  function unpackTopicMeta(body){
    var raw=String(body||'');
    if(raw.indexOf(TOPIC_META_PREFIX)!==0) return null;
    try { return JSON.parse(raw.slice(TOPIC_META_PREFIX.length)) || null; }
    catch(e){ return null; }
  }

  function valIn(scope,id){
    var el=scope && scope.querySelector('#'+id);
    return cleanText(el ? el.value : '', 300000);
  }

  function labelText(text, fallback){
    var v=cleanText(text, 80);
    return v || fallback;
  }

  function makeTopicHtmlFromMeta(meta, fallbackTitle){
    meta = meta && typeof meta === 'object' ? meta : {};
    var mode = meta.mode === 'text' ? 'text' : 'macro';
    var enTitle = cleanText(meta.enTitle || meta.titleEn || fallbackTitle || 'New Topic', 180);
    var arTitle = cleanText(meta.arTitle || meta.titleAr || fallbackTitle || 'موضوع جديد', 180);

    if(mode === 'text'){
      var enText = cleanText(meta.enText || meta.enAnswer || '', 300000);
      var arText = cleanText(meta.arText || meta.arAnswer || '', 300000);
      if(typeof createDualContent === 'function') return createDualContent(enText || enTitle, arText || arTitle);
      return makePaneHtml(arTitle || enTitle, arText || enText || '');
    }

    var enFields = [];
    var arFields = [];
    var enAnswer = cleanText(meta.enAnswer || meta.enText || '', 300000);
    var arAnswer = cleanText(meta.arAnswer || meta.arText || '', 300000);
    var enTicket = cleanText(meta.enTicket || '', 300000);
    var arTicket = cleanText(meta.arTicket || '', 300000);
    var enMention = cleanText(meta.enMention || meta.enForm || '', 300000);
    var arMention = cleanText(meta.arMention || meta.arForm || '', 300000);

    if(enAnswer) enFields.push({label:'Answer', text:enAnswer});
    if(enTicket) enFields.push({label:'Ticket', text:enTicket});
    if(enMention) enFields.push({label: labelText(meta.enInternalLabel, 'Mention / Escalation'), text: enMention});

    if(arAnswer) arFields.push({label:'الإجابة', text:arAnswer});
    if(arTicket) arFields.push({label:'التذكرة', text:arTicket});
    if(arMention) arFields.push({label: labelText(meta.arInternalLabel, 'المنشن / التصعيد'), text: arMention});

    if(!enFields.length && !arFields.length){
      enFields.push({label:'Answer', text:enTitle});
      arFields.push({label:'الإجابة', text:arTitle});
    }

    if(typeof createSupportMacroContent === 'function'){
      return createSupportMacroContent(enTitle, enFields, arTitle, arFields);
    }
    return makePaneHtml(arTitle || enTitle, arAnswer || enAnswer || arTicket || enTicket || '');
  }

  function collectTopicMeta(scope, name){
    var modeEl=scope.querySelector('#sugoTinyMode');
    var mode=(modeEl && modeEl.value)==='text' ? 'text' : 'macro';
    return {
      mode: mode,
      enTitle: valIn(scope,'sugoTinyEnTitle') || name,
      arTitle: valIn(scope,'sugoTinyArTitle') || name,
      enText: valIn(scope,'sugoTinyEnText'),
      arText: valIn(scope,'sugoTinyArText'),
      enAnswer: valIn(scope,'sugoTinyEnAnswer'),
      arAnswer: valIn(scope,'sugoTinyArAnswer'),
      enTicket: valIn(scope,'sugoTinyEnTicket'),
      arTicket: valIn(scope,'sugoTinyArTicket'),
      enMention: valIn(scope,'sugoTinyEnMention'),
      arMention: valIn(scope,'sugoTinyArMention'),
      enInternalLabel: valIn(scope,'sugoTinyEnInternalLabel') || 'Mention / Escalation',
      arInternalLabel: valIn(scope,'sugoTinyArInternalLabel') || 'المنشن / التصعيد'
    };
  }

  function refreshTopicMode(scope){
    var modeEl=scope.querySelector('#sugoTinyMode');
    var mode=(modeEl && modeEl.value)==='text' ? 'text' : 'macro';
    var macro=scope.querySelectorAll('[data-topic-mode="macro"]');
    var textOnly=scope.querySelectorAll('[data-topic-mode="text"]');
    macro.forEach(function(el){ el.style.display = mode==='macro' ? '' : 'none'; });
    textOnly.forEach(function(el){ el.style.display = mode==='text' ? '' : 'none'; });
  }


  function getPaneStoreForTopicEdit(){
    if(window.paneContent) return window.paneContent;
    try{ if(typeof paneContent !== 'undefined') return paneContent; }catch(e){}
    return null;
  }

  function paneTargetForTopicEdit(pane){
    if(!pane) return null;
    var existing=pane.querySelector(':scope > .sugo-direct-edit-target');
    if(existing) return existing;
    var kids=Array.prototype.slice.call(pane.children || []);
    return kids.find(function(el){
      return el && el.classList &&
        !el.classList.contains('close-pane-btn') &&
        !el.classList.contains('sugo-direct-edit-toolbar') &&
        !el.classList.contains('sugo-inline-edit-toolbar');
    }) || null;
  }

  function paneHtmlForTopicEdit(paneId){
    var pane=byId('pane-'+paneId);
    var target=paneTargetForTopicEdit(pane);
    if(target) return target.innerHTML || '';
    var store=getPaneStoreForTopicEdit();
    var rec=store && store[paneId];
    if(!rec) return '';
    return typeof rec === 'object' ? String(rec.en || rec.html || '') : String(rec || '');
  }

  function cloneTextForTopicEdit(node){
    if(!node) return '';
    var clone=node.cloneNode(true);
    clone.querySelectorAll('button,.copy-buttons,.sugo-view-controls,.sugo-min-filter-panel,.sugo-efficiency-panel,.sugo-filter-empty,.lang-divider,.sugo-internal-title,.close-pane-btn,.sugo-direct-edit-toolbar,.sugo-inline-edit-toolbar').forEach(function(el){ el.remove(); });
    return cleanText(htmlToFormattedPlainTextForTopicEdit(clone), 300000);
  }

  function htmlToFormattedPlainTextForTopicEdit(root){
    if(!root) return '';
    var out = '';
    var listStack = [];
    var blockTags = {
      p:1, div:1, section:1, article:1, header:1, footer:1, aside:1,
      h1:1, h2:1, h3:1, h4:1, h5:1, h6:1, blockquote:1, table:1, tr:1
    };

    function add(text){
      text = String(text || '').replace(/\u00a0/g, ' ');
      if(!text) return;
      text = text.replace(/[ \t\f\v]+/g, ' ');
      text = text.replace(/\s*\n\s*/g, '\n');
      out += text;
    }
    function lineBreak(){
      out = out.replace(/[ \t]+$/g, '');
      if(out && !/\n$/.test(out)) out += '\n';
    }
    function ensureLineStart(){
      out = out.replace(/[ \t]+$/g, '');
      if(out && !/\n$/.test(out)) out += '\n';
    }
    function walk(node){
      if(!node) return;
      if(node.nodeType === 3){ add(node.nodeValue || ''); return; }
      if(node.nodeType !== 1) return;

      var tag = String(node.tagName || '').toLowerCase();
      if(tag === 'script' || tag === 'style' || tag === 'noscript') return;
      if(tag === 'br'){ lineBreak(); return; }
      if(tag === 'pre'){
        ensureLineStart();
        out += String(node.textContent || '').replace(/\u00a0/g, ' ');
        lineBreak();
        return;
      }
      if(tag === 'ul' || tag === 'ol'){
        ensureLineStart();
        listStack.push({ type: tag, index: Number(node.getAttribute('start')) || 1 });
        Array.prototype.forEach.call(node.childNodes || [], walk);
        listStack.pop();
        lineBreak();
        return;
      }
      if(tag === 'li'){
        ensureLineStart();
        var list = listStack[listStack.length - 1] || { type: 'ul', index: 1 };
        if(list.type === 'ol'){
          out += (list.index || 1) + '- ';
          list.index = (list.index || 1) + 1;
        } else {
          out += '• ';
        }
        Array.prototype.forEach.call(node.childNodes || [], walk);
        lineBreak();
        return;
      }
      if(tag === 'td' || tag === 'th'){
        Array.prototype.forEach.call(node.childNodes || [], walk);
        out = out.replace(/[ \t]+$/g, '') + '\t';
        return;
      }
      if(blockTags[tag]) ensureLineStart();
      Array.prototype.forEach.call(node.childNodes || [], walk);
      if(blockTags[tag]) lineBreak();
    }

    walk(root);
    return String(out || '')
      .replace(/\r/g, '')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n[ \t]+/g, '\n')
      .replace(/\t+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function findCustomTopicItem(paneId){
    paneId=String(paneId || '');
    return (menuState.items || []).find(function(item){
      return !isControlItem(item) && item.type === 'topic' && (String(item.paneId || '') === paneId || String(item.id || '') === paneId);
    }) || null;
  }

  function topicTargetByPaneId(paneId){
    var nav=byId('sidebarNav');
    if(!nav || !paneId) return null;
    var btn=nav.querySelector('.nav-l000-btn[data-pane="'+cssEsc(paneId)+'"]');
    if(!btn) return null;
    return {level:'topic', key:topicKey(btn), el:btn, label:textOf(btn)};
  }

  function topicMetaFromPane(paneId, fallbackName){
    var item=findCustomTopicItem(paneId);
    var meta=item ? unpackTopicMeta(item.body) : null;
    if(meta) return meta;

    var html=paneHtmlForTopicEdit(paneId);
    var wrap=document.createElement('div');
    wrap.innerHTML=html || '';
    var name=cleanText(fallbackName || '',180) || 'Topic';
    var parsed={
      mode:'macro',
      enTitle:name,
      arTitle:name,
      enText:'',
      arText:'',
      enAnswer:'',
      arAnswer:'',
      enTicket:'',
      arTicket:'',
      enMention:'',
      arMention:'',
      enInternalLabel:'Mention / Escalation',
      arInternalLabel:'المنشن / التصعيد'
    };

    function fieldKind(label, type){
      var raw=(String(type || '')+' '+String(label || '')).toLowerCase();
      if(/ticket|تذكرة|تذكره/.test(raw)) return 'ticket';
      if(/answer|الإجابة|الاجابة/.test(raw)) return 'answer';
      if(/mention|منشن|form|نموذج|internal|escalation|تصعيد|ملاحظة/.test(raw)) return 'mention';
      return type || 'text';
    }

    function readCol(col, lang){
      if(!col) return;
      var title=cloneTextForTopicEdit(col.querySelector('.macro-title'));
      if(title){ if(lang==='en') parsed.enTitle=title; else parsed.arTitle=title; }
      Array.prototype.forEach.call(col.querySelectorAll('.macro-field'), function(field){
        var label=cloneTextForTopicEdit(field.querySelector('.macro-label')) || field.getAttribute('data-section-label') || '';
        var text=cloneTextForTopicEdit(field.querySelector('.macro-body'));
        if(!text) return;
        var kind=fieldKind(label, field.getAttribute('data-type') || '');
        if(lang==='en'){
          if(kind==='ticket' && !parsed.enTicket) parsed.enTicket=text;
          else if(kind==='answer' && !parsed.enAnswer) parsed.enAnswer=text;
          else if(!parsed.enMention){ parsed.enMention=text; parsed.enInternalLabel=label || parsed.enInternalLabel; }
        } else {
          if(kind==='ticket' && !parsed.arTicket) parsed.arTicket=text;
          else if(kind==='answer' && !parsed.arAnswer) parsed.arAnswer=text;
          else if(!parsed.arMention){ parsed.arMention=text; parsed.arInternalLabel=label || parsed.arInternalLabel; }
        }
      });
    }

    readCol(wrap.querySelector('.macro-col[dir="ltr"]'), 'en');
    readCol(wrap.querySelector('.macro-col[dir="rtl"]'), 'ar');

    var enTextNode=wrap.querySelector('.sugo-section[data-lang="en"][data-type="text"]');
    var arTextNode=wrap.querySelector('.sugo-section[data-lang="ar"][data-type="text"]');
    if(enTextNode || arTextNode){
      parsed.mode='text';
      parsed.enText=cloneTextForTopicEdit(enTextNode);
      parsed.arText=cloneTextForTopicEdit(arTextNode);
      var enTitle=wrap.querySelector('.macro-col[dir="ltr"] .macro-title');
      var arTitle=wrap.querySelector('.macro-col[dir="rtl"] .macro-title');
      if(enTitle) parsed.enTitle=cloneTextForTopicEdit(enTitle) || parsed.enTitle;
      if(arTitle) parsed.arTitle=cloneTextForTopicEdit(arTitle) || parsed.arTitle;
    }

    if(!parsed.enAnswer && !parsed.arAnswer && !parsed.enTicket && !parsed.arTicket && !parsed.enText && !parsed.arText){
      parsed.mode='text';
      parsed.arText=cloneTextForTopicEdit(wrap) || name;
      parsed.enText='';
    }
    return parsed;
  }

  function fillTopicBuilderForm(scope, name, meta){
    meta=meta && typeof meta==='object' ? meta : {};
    var map={
      sugoTinyName:name || '',
      sugoTinyMode:meta.mode==='text' ? 'text' : 'macro',
      sugoTinyEnTitle:meta.enTitle || name || '',
      sugoTinyArTitle:meta.arTitle || name || '',
      sugoTinyEnText:meta.enText || '',
      sugoTinyArText:meta.arText || '',
      sugoTinyEnAnswer:meta.enAnswer || '',
      sugoTinyArAnswer:meta.arAnswer || '',
      sugoTinyEnTicket:meta.enTicket || '',
      sugoTinyArTicket:meta.arTicket || '',
      sugoTinyEnMention:meta.enMention || '',
      sugoTinyArMention:meta.arMention || '',
      sugoTinyEnInternalLabel:meta.enInternalLabel || 'Mention / Escalation',
      sugoTinyArInternalLabel:meta.arInternalLabel || 'المنشن / التصعيد'
    };
    Object.keys(map).forEach(function(id){
      var el=scope.querySelector('#'+id);
      if(el) el.value=map[id];
    });
    refreshTopicMode(scope);
  }

  async function savePaneOverrideFromTopicEditor(paneId, html){
    if(!adminMode || !adminPassword){
      var unlocked=await unlockAdmin();
      if(!unlocked) return false;
    }
    try{
      var res=await fetch(WORKER_URL + '/admin/pane', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':authHeader(adminPassword)},
        body:JSON.stringify({paneId:paneId, html:html})
      });
      var data=await res.json().catch(function(){return {};});
      if(!res.ok || !data || !data.ok){
        alert('Content save failed: '+((data && data.error) || res.status));
        return false;
      }
      window.__SUGO_ADMIN_PASSWORD=adminPassword;
      return true;
    }catch(e){
      alert('Connection failed while saving content.');
      return false;
    }
  }

  function rerenderPaneAfterTopicEdit(paneId, html){
    var store=getPaneStoreForTopicEdit();
    if(store){
      if(store[paneId] && typeof store[paneId] === 'object') store[paneId].en=html;
      else store[paneId]={en:html};
    }
    if(typeof window.setPane === 'function') window.setPane(paneId, html);
    var rendered=byId('pane-'+paneId);
    if(rendered && rendered.remove) rendered.remove();
    try{ if(typeof renderedPanes !== 'undefined' && renderedPanes && renderedPanes.delete) renderedPanes.delete(paneId); }catch(e){}
    if(typeof window.showPane === 'function'){
      window.showPane(paneId, true);
    }
  }

  function openEditTopicModal(target){
    target=target || getSelectedTarget('topic');
    if(!target){ alert('Choose topic first.'); return false; }
    var paneId=target.key;
    var currentName=target.label || 'Topic';
    var meta=topicMetaFromPane(paneId, currentName);
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:min(96vw,920px)">'+
      '<h3>Edit topic</h3>'+
      '<p>تعديل نفس التوبك الموجود باستخدام نفس قائمة Add topic.</p>'+
      '<label>Name</label><input id="sugoTinyName" placeholder="Name">'+
      topicBuilderHtml()+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    var modeEl=bd.querySelector('#sugoTinyMode');
    if(modeEl) modeEl.onchange=function(){ refreshTopicMode(bd); };
    fillTopicBuilderForm(bd, currentName, meta);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){ alert('Write a name.'); return; }
      var nextMeta=collectTopicMeta(bd,name);
      var hasAny=(nextMeta.mode==='text') ? (nextMeta.enText || nextMeta.arText) : (nextMeta.enAnswer || nextMeta.arAnswer || nextMeta.enTicket || nextMeta.arTicket || nextMeta.enMention || nextMeta.arMention);
      if(!hasAny){ alert('Add Arabic or English content first.'); return; }
      var html=makeTopicHtmlFromMeta(nextMeta,name);

      menuState=cleanState(menuState);
      var item=findCustomTopicItem(paneId);
      if(item){
        item.label=name;
        item.body=packTopicMeta(nextMeta);
        item.html=html;
        item.paneId=paneId;
        item.updatedAt=new Date().toISOString();
      } else {
        setRename('topic', paneId, name);
      }
      menuState.updatedAt=new Date().toISOString();

      if(!(await saveMenu())) return;
      if(!(await savePaneOverrideFromTopicEditor(paneId, html))) return;

      bd.remove();
      refreshMenuAfterChange(paneId);
      rerenderPaneAfterTopicEdit(paneId, html);
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i){ i.focus(); i.select(); }},30);
    return true;
  }


  function topicBuilderHtml(){
    return ''+
      '<div class="sugo-topic-builder">'+
        '<div class="sugo-topic-builder-title">Topic content — نفس تصميم الملف الأصلي</div>'+
        '<label>Content style</label>'+
        '<select id="sugoTinyMode"><option value="macro">Answer + Ticket + Copy buttons</option><option value="text">Text only</option></select>'+
        '<div class="sugo-topic-hint">سيظهر داخل القسم خيارات Language / Content وأزرار Copy مثل المحتوى الأصلي.</div>'+
        '<div class="sugo-topic-grid">'+
          '<div><label>English title</label><input id="sugoTinyEnTitle" class="sugo-topic-en" placeholder="English title"></div>'+
          '<div><label>Arabic title</label><input id="sugoTinyArTitle" class="sugo-topic-ar" placeholder="العنوان العربي"></div>'+
          '<div data-topic-mode="text"><label>English text</label><textarea id="sugoTinyEnText" class="sugo-topic-en" placeholder="English text"></textarea></div>'+
          '<div data-topic-mode="text"><label>Arabic text</label><textarea id="sugoTinyArText" class="sugo-topic-ar" placeholder="النص العربي"></textarea></div>'+
          '<div data-topic-mode="macro"><label>English answer</label><textarea id="sugoTinyEnAnswer" class="sugo-topic-en" placeholder="English answer"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Arabic answer</label><textarea id="sugoTinyArAnswer" class="sugo-topic-ar" placeholder="الإجابة العربية"></textarea></div>'+
          '<div data-topic-mode="macro"><label>English ticket</label><textarea id="sugoTinyEnTicket" class="sugo-topic-en" placeholder="English ticket / customer reply"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Arabic ticket</label><textarea id="sugoTinyArTicket" class="sugo-topic-ar" placeholder="التذكرة / الرد العربي للعميل"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Internal label EN</label><input id="sugoTinyEnInternalLabel" class="sugo-topic-en" placeholder="Mention / Form / Internal Note"></div>'+
          '<div data-topic-mode="macro"><label>Internal label AR</label><input id="sugoTinyArInternalLabel" class="sugo-topic-ar" placeholder="المنشن / النموذج / ملاحظة داخلية"></div>'+
          '<div data-topic-mode="macro"><label>Internal EN optional</label><textarea id="sugoTinyEnMention" class="sugo-topic-en" placeholder="Internal mention / form / note - optional"></textarea></div>'+
          '<div data-topic-mode="macro"><label>Internal AR optional</label><textarea id="sugoTinyArMention" class="sugo-topic-ar" placeholder="منشن / نموذج / ملاحظة داخلية - اختياري"></textarea></div>'+
        '</div>'+
      '</div>';
  }

  function openAdd(level){
    var path=getPath();
    if(level==='category' && !path.root){ alert('Choose a menu first.'); return; }
    if(level==='section' && (!path.root||!path.category)){ alert('Choose a menu and category first.'); return; }
    if(level==='topic' && (!path.root||!path.category||!path.section)){ alert('Choose menu, category and section first.'); return; }

    var isTopic=level==='topic';
    var title=level==='root'?'Add main menu':level==='category'?'Add category':level==='section'?'Add section':'Add topic';
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:'+ (isTopic?'min(96vw,920px)':'min(94vw,480px)') +'">'+
      '<h3>'+esc(title)+'</h3>'+
      '<p>إضافة مباشرة داخل نفس القوائم الموجودة.</p>'+
      '<label>Name</label><input id="sugoTinyName" placeholder="Name">'+
      (isTopic ? topicBuilderHtml() : '')+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    if(isTopic){
      var modeEl=bd.querySelector('#sugoTinyMode');
      if(modeEl){ modeEl.onchange=function(){ refreshTopicMode(bd); }; refreshTopicMode(bd); }
    }
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){alert('Write a name.'); return;}
      var item={type:level,id:slug(name,level),label:name,updatedAt:new Date().toISOString()};

      if(level==='category') item.rootKey=rootKey(path.root);
      if(level==='section'){
        item.rootKey=rootKey(path.root);
        item.categoryKey=catKey(path.category);
      }
      if(level==='topic'){
        item.rootKey=rootKey(path.root);
        item.categoryKey=catKey(path.category);
        item.sectionKey=secKey(path.section);
        item.paneId=slug(name,'custom-topic');
        var meta=collectTopicMeta(bd,name);
        var hasAny = (meta.mode==='text') ? (meta.enText || meta.arText) : (meta.enAnswer || meta.arAnswer || meta.enTicket || meta.arTicket || meta.enMention || meta.arMention);
        if(!hasAny){ alert('Add Arabic or English content first.'); return; }
        item.body=packTopicMeta(meta);
        item.html=makeTopicHtmlFromMeta(meta,name);
      }

      menuState=cleanState(menuState);
      menuState.items.push(item);
      menuState.updatedAt=new Date().toISOString();

      if(await saveMenu()){
        bd.remove();
        refreshMenuAfterChange(item.paneId || item.id);
      } else {
        menuState.items.pop();
      }
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i) i.focus();},30);
  }

  function updateCustomItem(target, newName){
    var changed=false;
    (menuState.items||[]).forEach(function(item){
      if(isControlItem(item)) return;
      if(item.id===target.key || item.paneId===target.key){
        item.label=newName;
        item.updatedAt=new Date().toISOString();
        if(item.type==='topic' && item.html && item.body){
          var meta=unpackTopicMeta(item.body);
          if(meta){
            if(!meta.enTitle || meta.enTitle===target.label) meta.enTitle=newName;
            if(!meta.arTitle || meta.arTitle===target.label) meta.arTitle=newName;
            item.body=packTopicMeta(meta);
            item.html=makeTopicHtmlFromMeta(meta,newName);
          } else {
            item.html=makePaneHtml(newName,item.body);
          }
        }
        changed=true;
      }
    });
    return changed;
  }

  function removeCustomItem(target){
    var before=(menuState.items||[]).length;
    var t=target;
    menuState.items=(menuState.items||[]).filter(function(item){
      if(isControlItem(item)) return true;
      if(item.id===t.key || item.paneId===t.key) return false;
      if(t.level==='root' && item.rootKey===t.key) return false;
      if(t.level==='category' && item.categoryKey===t.key) return false;
      if(t.level==='section' && item.sectionKey===t.key) return false;
      return true;
    });
    return menuState.items.length!==before;
  }

  function openRename(level){
    if(level === 'topic'){
      openEditTopicModal();
      return;
    }
    var target=getSelectedTarget(level);
    if(!target){ alert('Choose item first.'); return; }
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card"><h3>Edit name</h3><p>تعديل اسم العنصر المختار فقط.</p><label>Name</label><input id="sugoTinyName" placeholder="Name" value="'+attr(target.label)+'"><div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button><button class="sugo-tiny-plus-save" type="button">Save</button></div></div>';
    document.body.appendChild(bd);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    bd.querySelector('.sugo-tiny-plus-save').onclick=async function(){
      var name=cleanText(bd.querySelector('#sugoTinyName').value,180);
      if(!name){ alert('Write a name.'); return; }
      menuState=cleanState(menuState);
      if(!updateCustomItem(target,name)) setRename(level,target.key,name);
      menuState.updatedAt=new Date().toISOString();
      if(await saveMenu()){
        bd.remove();
        refreshMenuAfterChange(target.level==='topic' ? target.key : '');
      }
    };
    setTimeout(function(){var i=bd.querySelector('#sugoTinyName'); if(i){ i.focus(); i.select(); }},30);
  }

  async function deleteSelected(level){
    var target=getSelectedTarget(level);
    if(!target){ alert('Choose item first.'); return; }
    if(!confirm('Delete "'+target.label+'"?')) return;
    menuState=cleanState(menuState);
    if(!removeCustomItem(target)) setDelete(level,target.key);
    menuState.updatedAt=new Date().toISOString();
    if(await saveMenu()){
      try{
        if(target.level==='root'){ var sel=byId('sugoLibrarySelect'); if(sel){ var opt=sel.querySelector('option[value="'+cssEsc(target.key)+'"]'); if(opt) opt.remove(); } }
        if(target.el && target.el.remove) target.el.remove();
      }catch(e){}
      refreshMenuAfterChange('');
    }
  }

  function openLevelPicker(action){
    var labels={add:'Add',rename:'Edit name',del:'Delete'};
    var bd=document.createElement('div');
    bd.className='sugo-tiny-plus-backdrop active';
    bd.innerHTML='<div class="sugo-tiny-plus-card" style="width:min(94vw,520px)">'+
      '<h3>'+esc(labels[action]||'Edit')+'</h3>'+
      '<p>اختر المستوى الذي تريد العمل عليه. القائمة المختارة حاليًا ستُستخدم كمرجع.</p>'+
      '<div class="sugo-admin-level-grid">'+
        '<button data-level="root" type="button">Menu</button>'+
        '<button data-level="category" type="button">Category</button>'+
        '<button data-level="section" type="button">Section</button>'+
        '<button data-level="topic" type="button">Topic</button>'+
      '</div>'+
      '<div class="sugo-tiny-plus-actions"><button class="sugo-tiny-plus-cancel" type="button">Cancel</button></div>'+
    '</div>';
    document.body.appendChild(bd);
    bd.querySelector('.sugo-tiny-plus-cancel').onclick=function(){bd.remove();};
    Array.prototype.forEach.call(bd.querySelectorAll('[data-level]'), function(btn){
      btn.onclick=function(){
        var level=btn.getAttribute('data-level');
        bd.remove();
        if(action==='add') openAdd(level);
        else if(action==='rename') openRename(level);
        else if(action==='del') deleteSelected(level);
      };
    });
  }

  async function openAdminEditTools(anchor){
    if(!adminMode || !adminPassword){
      var ok=await unlockAdmin();
      if(!ok) return;
    }
    var old=document.getElementById('sugoTinyAdminPopover');
    if(old){ old.remove(); return; }
    var pop=document.createElement('div');
    pop.id='sugoTinyAdminPopover';
    pop.className='sugo-tiny-admin-popover';
    pop.innerHTML='<button type="button" data-action="add" title="Add">+</button><button type="button" data-action="rename" title="Edit name">✎</button><button type="button" data-action="del" title="Delete">×</button>';
    document.body.appendChild(pop);
    var r=anchor.getBoundingClientRect();
    pop.style.left=Math.max(8, Math.min(window.innerWidth-120, r.right + 8))+'px';
    pop.style.top=Math.max(8, r.top - 2)+'px';
    pop.onclick=function(e){
      var b=e.target.closest && e.target.closest('button[data-action]');
      if(!b) return;
      e.preventDefault(); e.stopPropagation();
      var action=b.getAttribute('data-action');
      pop.remove();
      openLevelPicker(action);
    };
    setTimeout(function(){
      function closer(e){
        if(pop && !pop.contains(e.target) && e.target!==anchor){ pop.remove(); document.removeEventListener('click',closer,true); }
      }
      document.addEventListener('click',closer,true);
    },0);
  }

  function installTinyButtons(){
    var label=document.querySelector('label[for="sugoLibrarySelect"]');
    if(!label || label.dataset.sugoSingleAdminEdit==='1') return;
    var row=document.createElement('div');
    row.className='sugo-tiny-label-row sugo-single-edit-row';
    label.parentNode.insertBefore(row,label);
    row.appendChild(label);
    var btn=document.createElement('button');
    btn.className='sugo-single-edit-btn';
    btn.type='button';
    btn.textContent='Edit';
    btn.title='Admin edit menu';
    btn.onclick=function(e){e.preventDefault();e.stopPropagation();openAdminEditTools(btn);};
    row.appendChild(btn);
    label.dataset.sugoSingleAdminEdit='1';
  }

  window.SUGO_TINY_PLUS_EDIT_TOPIC = function(paneId){
    var target = topicTargetByPaneId(paneId) || getSelectedTarget('topic');
    if(!target) return false;
    return openEditTopicModal(target);
  };

  // Critical: apply cached custom menus, renames, and deletes immediately before the original cascade menu initializes.
  menuState=readCache();
  applyMenu(menuState);

  function fetchFreshMenu(){
    fetch(WORKER_URL+'/menu?ts='+Date.now()).then(function(r){return r.json();}).then(function(data){
      if(data && data.ok && data.menu){
        var fresh=cleanState(data.menu);
        if(!sameState(fresh, menuState)){
          menuState=fresh;
          writeCache(fresh);
          applyMenu(fresh);
          installTinyButtons();
          if(window.SugoApp && window.SugoApp.navigation && typeof window.SugoApp.navigation.refreshMenuDom === 'function'){
            window.SugoApp.navigation.refreshMenuDom({});
          }
        } else {
          sessionStorage.removeItem('sugo_menu_refresh_once');
        }
      }
    }).catch(function(){});
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', function(){
      installTinyButtons();
      setTimeout(installTinyButtons,500);
      fetchFreshMenu();
    });
  } else {
    installTinyButtons();
    setTimeout(installTinyButtons,500);
    fetchFreshMenu();
  }
})();
