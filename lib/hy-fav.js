/* ===== 編織日和遊戲｜「加到我的最愛」按鈕（全部遊戲共用） =====
   用法：頁面結尾加一行 <script src="/lib/hy-fav.js" defer></script>
   做什麼：在每個「複製連結」按鈕後面自動補一顆「加到我的最愛」，樣式跟著該遊戲的複製按鈕。
   瀏覽器不允許網頁自己加書籤，所以按下去是跳出「這台裝置怎麼加」的提示。
   GA4：bookmark_shortcut，option＝inapp／ios／android／mac／desktop（games 規範 3-2）
   注意：整份不含「和號」字元，新增程式時請維持 */
(function(){
  if (window.hyFav) return;
  var COPY_SEL = '[data-share="copy_link"],[data-share-net="copy_link"],#shCopy,#copylink,.btn.share.copy,.s-copy';
  var DEBUG = /[?\x26]hy_debug=1/.test(location.search);

  var TEXT = {
    zh: {
      btn: '加到我的最愛',
      title: '把這個遊戲加到我的最愛',
      ok: '知道了',
      inapp: '你現在是在 App 內建的瀏覽器裡，這裡沒辦法加書籤。請點右上角或右下角的選單，選「用瀏覽器開啟」；或先按「複製連結」，貼到 Safari 或 Chrome 打開，再加到我的最愛。',
      ios: '點瀏覽器的「分享」按鈕（方框加向上箭頭），選「加入書籤」。選「加入主畫面」的話，手機桌面會多一個圖示，一點就回來。',
      android: '點右上角的「⋮」，再點「☆」加入書籤。選「加到主畫面」的話，手機桌面會多一個圖示，一點就回來。',
      mac: '按鍵盤 ⌘ + D，就能加到我的最愛（書籤），下次從書籤列一點就回來。',
      desktop: '按鍵盤 Ctrl + D，就能加到我的最愛（書籤），下次從書籤列一點就回來。'
    },
    en: {
      btn: 'Add to favorites',
      title: 'Add this game to your favorites',
      ok: 'Got it',
      inapp: 'You are in an in-app browser, which cannot save bookmarks. Open the menu and choose "Open in browser", or tap "Copy link" and paste it into Safari or Chrome, then add it to your favorites.',
      ios: 'Tap the Share button (a square with an arrow pointing up), then choose "Add Bookmark". "Add to Home Screen" puts an icon on your phone so you can come back in one tap.',
      android: 'Tap the ⋮ menu at the top right, then tap ☆ to bookmark. "Add to Home screen" puts an icon on your phone so you can come back in one tap.',
      mac: 'Press ⌘ + D to add this page to your favorites (bookmarks).',
      desktop: 'Press Ctrl + D to add this page to your favorites (bookmarks).'
    },
    ja: {
      btn: 'お気に入りに追加',
      title: 'このゲームをお気に入りに追加',
      ok: 'OK',
      inapp: 'アプリ内ブラウザではブックマークできません。メニューから「ブラウザで開く」を選ぶか、「リンクをコピー」して Safari や Chrome に貼り付けてから、お気に入りに追加してください。',
      ios: 'ブラウザの「共有」ボタン（四角に上向き矢印）をタップして、「ブックマークを追加」を選びます。「ホーム画面に追加」を選ぶと、ホーム画面にアイコンができます。',
      android: '右上の「⋮」をタップして、「☆」でブックマークに追加します。「ホーム画面に追加」を選ぶと、ホーム画面にアイコンができます。',
      mac: 'キーボードの ⌘ + D で、お気に入り（ブックマーク）に追加できます。',
      desktop: 'キーボードの Ctrl + D で、お気に入り（ブックマーク）に追加できます。'
    }
  };

  function lang(){
    var l = (document.documentElement.getAttribute('lang') || 'zh').toLowerCase();
    if (l.indexOf('en') === 0) return 'en';
    if (l.indexOf('ja') === 0) return 'ja';
    return 'zh';
  }
  function device(){
    var ua = navigator.userAgent || '';
    if (/Line\/|FBAN|FBAV|FB_IAB|Instagram|Barcelona|Threads|MicroMessenger/i.test(ua)) return 'inapp';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Macintosh/.test(ua)) return navigator.maxTouchPoints > 1 ? 'ios' : 'mac';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
  }
  function send(option){
    var p = { option: option };
    try {
      if (window.hyGame) { if (typeof window.hyGame.event === 'function') { window.hyGame.event('bookmark_shortcut', p); return; } }
      p.game_id = window.HY_GAME_ID || 'hub';
      p.page_lang = ({ zh: 'zh-Hant', en: 'en', ja: 'ja' })[lang()];
      p.content_group = 'game';
      if (DEBUG) { p.debug_mode = true; if (window.console) console.log('[hy-game]', 'bookmark_shortcut', p); }
      if (typeof window.gtag === 'function') window.gtag('event', 'bookmark_shortcut', p);
    } catch(e) {}
  }

  var tip = null, lastBtn = null;
  function css(){
    if (document.getElementById('hy-fav-css')) return;
    var st = document.createElement('style');
    st.id = 'hy-fav-css';
    st.textContent =
      '.hy-fav-tip{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;max-width:440px;margin:0 auto;box-sizing:border-box;background:#fff;color:#16161a;border:2px solid #16161a;border-radius:14px;padding:16px 16px 14px;box-shadow:0 10px 30px rgba(0,0,0,.25);font:15px/1.7 "Noto Sans TC","PingFang TC","Hiragino Sans","Microsoft JhengHei",system-ui,sans-serif;text-align:left;letter-spacing:0}' +
      '.hy-fav-tip b{display:block;font-size:16px;font-weight:700;margin:0 0 6px;color:#16161a}' +
      '.hy-fav-tip p{margin:0 0 12px;color:#16161a;font-size:15px}' +
      '.hy-fav-tip button{display:block;width:100%;min-height:44px;border:0;border-radius:10px;background:#16161a;color:#fff;font:inherit;font-weight:700;cursor:pointer}' +
      '.hy-fav-tip button:focus-visible{outline:3px solid #F2C12E;outline-offset:2px}';
    document.head.appendChild(st);
  }
  function close(){
    if (!tip) return;
    if (tip.parentNode) tip.parentNode.removeChild(tip);
    tip = null;
    try { if (lastBtn) { if (lastBtn.isConnected) lastBtn.focus(); } } catch(e) {}
  }
  function open(btn){
    var T = TEXT[lang()], d = device();
    close(); css();
    lastBtn = btn || null;
    tip = document.createElement('div');
    tip.className = 'hy-fav-tip';
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', T.title);
    var b = document.createElement('b'); b.textContent = '☆ ' + T.title;
    var p = document.createElement('p'); p.textContent = T[d];
    var ok = document.createElement('button'); ok.type = 'button'; ok.textContent = T.ok;
    ok.addEventListener('click', function(e){ e.stopPropagation(); close(); });
    tip.appendChild(b); tip.appendChild(p); tip.appendChild(ok);
    tip.addEventListener('click', function(e){ e.stopPropagation(); });
    document.body.appendChild(tip);
    try { ok.focus(); } catch(e) {}
    send(d);
  }
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') close(); });
  /* 掛在 window 的捕捉階段：比各遊戲掛在 document 的監聽更早收到，按這顆鈕不會被算成「開始玩」或其他分享 */
  window.addEventListener('click', function(e){
    var t = e.target, b = (t ? t.closest : false) ? t.closest('[data-hy-fav]') : null;
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    open(b);
  }, true);

  function make(copyBtn){
    var T = TEXT[lang()];
    var b = document.createElement('button');
    b.type = 'button';
    b.className = copyBtn.className;
    b.setAttribute('data-hy-fav', '1');
    var deco = copyBtn.firstElementChild;
    if (deco ? !deco.textContent.trim() : false) { b.appendChild(deco.cloneNode(false)); b.appendChild(document.createTextNode(T.btn)); }
    else b.textContent = '☆ ' + T.btn;
    return b;
  }
  function scan(root){
    var list, i, c, nx;
    try { list = (root || document).querySelectorAll(COPY_SEL); } catch(e) { return; }
    for (i = 0; i < list.length; i++) {
      c = list[i];
      if (c.hasAttribute('data-hy-fav')) continue;
      nx = c.nextElementSibling;
      if (nx ? nx.hasAttribute('data-hy-fav') : false) continue;
      if (!c.parentNode) continue;
      c.parentNode.insertBefore(make(c), c.nextSibling);
    }
  }
  function init(){
    scan(document);
    try {
      new MutationObserver(function(ms){
        var i, j, n;
        for (i = 0; i < ms.length; i++) {
          for (j = 0; j < ms[i].addedNodes.length; j++) {
            n = ms[i].addedNodes[j];
            if (n.nodeType !== 1) continue;
            if (n.hasAttribute('data-hy-fav')) continue;
            scan(n.parentNode || document);
          }
        }
      }).observe(document.body, { childList: true, subtree: true });
    } catch(e) {}
  }
  window.hyFav = { open: open, close: close, scan: scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
