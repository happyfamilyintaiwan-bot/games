/* 日和毛孩：讓它可以「加到主畫面」，沒網路也打得開。
   只處理打開遊戲頁本身：每次先拿網路上的新版（改版馬上看得到），沒網路才用上次存下來的那份。
   廣告、GA4、字體等其他請求一律不經過這裡。 */
var CACHE = 'hiyori-pet-v1';

self.addEventListener('install', function(){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('hiyori-pet-') === 0 ? k !== CACHE : false; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.mode !== 'navigate') return;
  e.respondWith(fetch(req).then(function(res){
    var copy = res.clone();
    caches.open(CACHE).then(function(c){ c.put('./', copy); });
    return res;
  }).catch(function(){
    return caches.match('./').then(function(r){ return r || Response.error(); });
  }));
});
