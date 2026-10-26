/* ===== 編織日和遊戲｜「下一款玩什麼」與「繼續上次的遊戲」（全部遊戲共用） =====
   用法：頁面結尾加一行 <script src="/lib/hy-next.js" defer></script>
   1. 每個遊戲頁：記下「最近來過哪一款」（localStorage hy_recent，只存 game_id 和時間）
   2. 遊戲頁有 <section data-hy-next></section> 時：讀遊戲主頁的卡片，挑同主題的 3 款放進去
      點擊送 cta_click，cta_id=next_game，cta_type=game（link_url 就是哪一款）
   3. 遊戲主頁有 <section data-hy-continue></section> 時：列出最近玩過的遊戲（最多 3 款）
      點擊送 cta_click，cta_id=continue_game，cta_type=game
   注意：整份不含「和號」字元，新增程式時請維持 */
(function(){
  if (window.hyNext) return;
  var RECENT_KEY = 'hy_recent';
  /* 舊玩家沒有 hy_recent 時，用各遊戲自己的存檔判斷「玩過」 */
  var SAVE_KEYS = {
    absolute_pitch: ['ap-dojo-v1'], morse_code: ['hy_morse_v1'], jlpt_mishitsu: ['jlpt-mishitsu-v1'],
    katsuyo_escape: ['ke_cleared', 'ke_best'], sql_detective: ['sqldet'], swiftui_detective: ['swiftui-noir-v2', 'swiftui-noir-v1'],
    tozai_dojo: ['tozai-best2'], sleep_rhythm: ['hy_sleep_v1'], hiyori_pet: ['hiyori-pet:save', 'hiyori-pet']
  };
  var GAME = window.HY_GAME_ID || '';

  function readRecent(){
    try { var o = JSON.parse(localStorage.getItem(RECENT_KEY) || '{}'); return (o ? typeof o === 'object' : false) ? o : {}; } catch(e) { return {}; }
  }
  function remember(){
    if (!GAME) return;
    if (GAME === 'hub') return;
    try { var o = readRecent(); o[GAME] = Date.now(); localStorage.setItem(RECENT_KEY, JSON.stringify(o)); } catch(e) {}
  }
  function hasSave(id){
    var ks = SAVE_KEYS[id] || [], i;
    for (i = 0; i < ks.length; i++) { try { if (localStorage.getItem(ks[i]) !== null) return true; } catch(e) {} }
    return false;
  }
  function ago(t){
    if (!t) return '玩過';
    var d = Math.floor((Date.now() - t) / 86400000);
    if (d < 1) return '今天';
    if (d === 1) return '昨天';
    if (d < 7) return d + ' 天前';
    if (d < 30) return Math.floor(d / 7) + ' 週前';
    return '一個月以上';
  }
  function esc(x){ var d = document.createElement('div'); d.textContent = x == null ? '' : String(x); return d.innerHTML; }

  /* 讀遊戲主頁的卡片：主頁就是遊戲清單的唯一來源，新增遊戲時這裡自動跟上 */
  var hubCache = null;
  function hubCards(){
    if (hubCache) return hubCache;
    hubCache = fetch('/').then(function(r){ return r.ok ? r.text() : ''; }).then(function(t){
      if (!t) return [];
      var doc = new DOMParser().parseFromString(t, 'text/html'), out = [];
      doc.querySelectorAll('a.card').forEach(function(c, i){
        var h = c.getAttribute('href'), g = c.getAttribute('data-game') || '', h3 = c.querySelector('h3'), p = c.querySelector('p');
        if (!h) return;
        if (!h3) return;
        out.push({ href: h, id: g, idx: i, title: h3.textContent.trim(), desc: p ? p.textContent.trim() : '',
          topic: (c.getAttribute('data-topic') || '').split(' ').filter(Boolean),
          skill: (c.getAttribute('data-skill') || '').split(' ').filter(Boolean) });
      });
      return out;
    }).catch(function(){ return []; });
    return hubCache;
  }

  function css(){
    if (document.getElementById('hy-next-css')) return;
    var st = document.createElement('style');
    st.id = 'hy-next-css';
    st.textContent =
      '.hy-next{max-width:960px;margin:28px auto;padding:0 16px;box-sizing:border-box;font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif;color:#16161a}' +
      '.hy-next h2{font-size:18px;line-height:1.4;margin:0 0 12px;font-weight:700;letter-spacing:.02em;color:#16161a}' +
      '.hy-next h2 small{display:block;font-size:12px;font-weight:500;color:#5f5f66;letter-spacing:.12em}' +
      '.hy-next-list{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}' +
      '.hy-next a{display:grid;gap:4px;align-content:start;padding:14px 16px;border:1.5px solid #e2e2e6;border-radius:14px;background:#fff;color:#16161a;text-decoration:none;min-height:44px;box-sizing:border-box}' +
      '.hy-next a:hover{border-color:#16161a}' +
      '.hy-next a:focus-visible{outline:3px solid #16161a;outline-offset:2px}' +
      '.hy-next a b{font-size:15px;line-height:1.45}' +
      '.hy-next a span{font-size:13px;line-height:1.6;color:#5f5f66;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.hy-next a em{font-style:normal;font-size:13px;font-weight:700;color:#16161a}' +
      '.hy-cont{display:flex;flex-wrap:wrap;gap:8px}' +
      '.hy-cont a{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 16px;border-radius:999px;border:1.5px solid #e2e2e6;background:#fff;color:#16161a;text-decoration:none;font-size:14px;font-weight:700}' +
      '.hy-cont a small{font-weight:500;font-size:12px;color:#5f5f66}';
    document.head.appendChild(st);
  }

  /* 下一款：同主題＋同練習重點的優先，分數相同時主頁排前面（較新）的優先，不足 3 款用最新的補 */
  function renderNext(box){
    var me = location.pathname.replace(/[^/]*$/, '');
    hubCards().then(function(cards){
      var mine = null, i;
      for (i = 0; i < cards.length; i++) { if (cards[i].id === GAME) mine = cards[i]; }
      var list = cards.filter(function(c){ return c.id !== GAME; }).filter(function(c){ return me.indexOf(c.href) !== 0; });
      list.forEach(function(c){
        var s = 0;
        if (mine) {
          c.topic.forEach(function(t){ if (mine.topic.indexOf(t) > -1) s = s + 3; });
          c.skill.forEach(function(t){ if (mine.skill.indexOf(t) > -1) s = s + 2; });
        }
        c.score = s;
      });
      list.sort(function(a, b){ return (b.score - a.score) || (a.idx - b.idx); });
      var pick = list.slice(0, 3);
      if (!pick.length) { box.hidden = true; return; }
      css();
      box.classList.add('hy-next');
      box.setAttribute('aria-labelledby', 'hyNextH');
      box.innerHTML = '<h2 id="hyNextH"><small>NEXT</small>玩完這款，接著試試</h2><div class="hy-next-list">' +
        pick.map(function(c){
          return '<a href="' + esc(c.href) + '" data-cta="next_game" data-cta-type="game"><b>' + esc(c.title) + '</b><span>' + esc(c.desc) + '</span><em>開始玩 →</em></a>';
        }).join('') + '</div>';
      box.hidden = false;
    });
  }

  /* 繼續玩（遊戲主頁）：hy_recent 有時間的照時間排，沒有的（舊存檔）排在後面 */
  function renderContinue(box){
    var rec = readRecent();
    hubCards().then(function(cards){
      var played = cards.filter(function(c){ return c.id ? (rec[c.id] ? true : hasSave(c.id)) : false; });
      played.sort(function(a, b){ return (rec[b.id] || 0) - (rec[a.id] || 0) || (a.idx - b.idx); });
      var pick = played.slice(0, 3);
      if (!pick.length) { box.hidden = true; return; }
      css();
      box.classList.add('hy-next');
      box.setAttribute('aria-labelledby', 'hyContH');
      box.innerHTML = '<h2 id="hyContH"><small>CONTINUE</small>繼續上次的遊戲</h2><div class="hy-cont">' +
        pick.map(function(c){
          return '<a href="' + esc(c.href) + '" data-cta="continue_game" data-cta-type="game">▶ ' + esc(c.title.split('：')[0]) + ' <small>' + ago(rec[c.id]) + '</small></a>';
        }).join('') + '</div>';
      box.hidden = false;
    });
  }

  function init(){
    remember();
    var n = document.querySelector('[data-hy-next]');
    if (n) renderNext(n);
    var c = document.querySelector('[data-hy-continue]');
    if (c) renderContinue(c);
  }
  window.hyNext = { recent: readRecent };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
