/* SUGO Phase 3 Service Worker — runtime cache, no full-pane precache. */
const SUGO_CACHE = 'sugo-phase3-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './assets/css/sugo.phase1.css',
  './assets/css/sugo.phase3.performance.css',
  './assets/js/sugo.core.phase2.js',
  './assets/js/sugo.loader.js',
  './assets/js/sugo.performance.phase3.js'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SUGO_CACHE).then(cache => cache.addAll(CORE_ASSETS).catch(() => null)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== SUGO_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function sameOrigin(url){ return url.origin === self.location.origin; }
function isRuntimeAsset(url){
  return sameOrigin(url) && (
    url.pathname.includes('/assets/panes/') ||
    url.pathname.includes('/assets/data/') ||
    url.pathname.includes('/assets/css/') ||
    url.pathname.includes('/assets/js/')
  );
}
function staleWhileRevalidate(request){
  return caches.open(SUGO_CACHE).then(cache => cache.match(request).then(cached => {
    const network = fetch(request).then(resp => {
      if(resp && resp.ok) cache.put(request, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || network;
  }));
}
function networkFirstForHtml(request){
  return caches.open(SUGO_CACHE).then(cache => fetch(request).then(resp => {
    if(resp && resp.ok) cache.put(request, resp.clone());
    return resp;
  }).catch(() => cache.match(request)));
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html')){
    event.respondWith(networkFirstForHtml(req));
    return;
  }
  if(isRuntimeAsset(url)){
    event.respondWith(staleWhileRevalidate(req));
  }
});
