/* 日和毛孩：讓它可以「加到主畫面」，沒網路也打得開。
   只處理打開遊戲頁本身：每次先拿網路上的新版（改版馬上看得到），沒網路才用上次存下來的那份。
   廣告、GA4、字體等其他請求一律不經過這裡。 */
var CACHE = 'hiyori-pet-v3';

self.addEventListener('install', function(){ self.skipWaiting(); });

self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k.indexOf('hiyori-pet-') === 0 ? k !== CACHE : false; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.mode !== 'navigate') return;
  /* cache: 'no-cache'：每次都先問伺服器有沒有新版（沒變只回一個很小的 304），不讓瀏覽器拿舊的那份 */
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function(res){
    var copy = res.clone();
    caches.open(CACHE).then(function(c){ c.put('./', copy); });
    return res;
  }).catch(function(){
    return caches.match('./').then(function(r){ return r || Response.error(); });
  }));
});

/* 走動提醒的通知：點一下就回到日和毛孩的分頁（沒開著就打開一個） */
self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list){
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf('/hiyori-pet/') >= 0) return list[i].focus(); }
    return self.clients.openWindow('./');
  }));
});
