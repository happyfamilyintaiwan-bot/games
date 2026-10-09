/* =====================================================================
   守燈人摩斯日誌｜遊戲畫面與流程
   依賴：/lib/hy-trainer/hy-trainer.js（共用引擎）、morse.js（內容包）、lang-zh.js（文字）
   一局＝一班：單字模式 25 個字、連發模式 9 組（27 個字）。
   整份檔案不含「和號」字元（core §3-1 #7），註解只用區塊註解。
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MORSE_T, M = window.Morse;
  if (!T || !M || !window.HyTrainer) return;

  /* ---------- 小工具 ---------- */
  function $(id) { return document.getElementById(id); }
  function F(s) { var a = arguments; return String(s).replace(/\{(\d)\}/g, function (m, i) { return a[+i + 1]; }); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function hg() { return window.hyGame || null; }
  function ev(name, p) { try { var h = hg(); if (h) h.event(name, p || {}); } catch (e) {} }
  function pct(x) { return Math.round(x * 100); }
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  var DEBUG = /[?\x26]hy_debug=1/.test(location.search);
  var PAGE_URL = 'https://games.knittinghiyori.com/morse-code/';

  /* ---------- 引擎與聲音 ---------- */
  var tr = HyTrainer.create({
    key: 'hy_morse_v1',
    order: M.KOCH,
    start: 2,
    stages: ['look', 'listen'],
    gate: { min: 25, threshold: 0.9 }
  });
  var player = new M.Player();
  function applySettings() {
    player.wpm = tr.get('wpm', 20);
    player.eff = Math.min(tr.get('eff', 12), player.wpm);
    player.freq = tr.get('freq', 600);
    player.setVolume(tr.get('vol', 60) / 100);
  }
  applySettings();

  /* 測試用：?hy_debug=1 加 hy_unlock=數字 */
  if (DEBUG) {
    var mu = location.search.match(/hy_unlock=(\d+)/);
    if (mu) { tr.setUnlocked(+mu[1]); tr.completeStage('look'); }
  }

  /* 進入方式：分享連結 → shared；有紀錄 → saved（在共用追蹤碼之前判斷） */
  try { if (/[?\x26]ref=share/.test(location.search)) { var h0 = hg(); if (h0) h0.start('shared'); } } catch (e) {}
  window.addEventListener('click', function (e) {
    if (!tr.hasProgress()) return;
    var t = e.target;
    if (!t.closest) return;
    if (!t.closest('#app')) return;
    if (t.closest('[data-cta]')) return;
    var h = hg(); if (h) h.start('saved');
  }, true);

  /* ---------- 畫面切換 ---------- */
  var views = {};
  document.querySelectorAll('[data-view]').forEach(function (v) { views[v.getAttribute('data-view')] = v; });
  var current = 'welcome';
  function show(name, focus) {
    current = name;
    for (var k in views) views[k].hidden = k !== name;
    renderModeSeg();
    if (focus) {
      var el = views[name].querySelector('h2');
      if (el) { el.setAttribute('tabindex', '-1'); el.focus({ preventScroll: true }); }
    }
  }
  function bringConsole() {
    var c = $('console'), r = c.getBoundingClientRect();
    if (r.top < 0 || r.top > window.innerHeight * 0.45) c.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- 場景：海岸的 41 盞燈 ---------- */
  var lampEls = [];
  function buildScene() {
    var layer = $('lampLayer'), path = $('coast');
    if (!layer || !path || !path.getTotalLength) return;
    var L = path.getTotalLength(), NS = 'http://www.w3.org/2000/svg', n = M.KOCH.length;
    for (var i = 0; i < n; i++) {
      var f = i / (n - 1);
      var t = Math.pow(f, 0.82);                  /* 越遠越密 */
      var p = path.getPointAtLength(t * L);
      var r = 6.2 - 4 * f;                        /* 越遠越小 */
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'lamp');
      var halo = document.createElementNS(NS, 'circle');
      halo.setAttribute('class', 'halo'); halo.setAttribute('cx', p.x); halo.setAttribute('cy', p.y - r * 0.4);
      halo.setAttribute('r', r * 4.2); halo.setAttribute('fill', 'url(#gHalo)');
      var core = document.createElementNS(NS, 'circle');
      core.setAttribute('class', 'core'); core.setAttribute('cx', p.x); core.setAttribute('cy', p.y - r * 0.4); core.setAttribute('r', r);
      g.appendChild(halo); g.appendChild(core);
      layer.appendChild(g);
      lampEls.push(g);
    }
  }
  function paintScene(popIndex) {
    var n = tr.unlockedCount();
    lampEls.forEach(function (g, i) {
      g.classList.toggle('lit', i < n);
      g.classList.toggle('newest', i === n - 1);
      if (i === popIndex) {
        g.classList.remove('pop'); void g.getBBox(); g.classList.add('pop');
      }
    });
    $('litCount').textContent = n;
  }
  function flash(on) {
    if (!tr.get('flash', true)) on = false;
    $('scene').classList.toggle('on', on);
    var d = current === 'play' ? $('disc') : null;
    if (d) d.classList.toggle('on', on);
    var gl = current === 'intro' ? $('introGlyph') : null;
    if (gl) gl.classList.toggle('on', on);
  }
  function play(text, extra) {
    extra = extra || {};
    var opt = { onTone: function (on, kind, i, e) { flash(on); if (extra.onTone) extra.onTone(on, kind, i, e); } };
    if (extra.eff !== undefined) opt.eff = extra.eff;
    return player.play(text, opt);
  }

  /* ---------- 歡迎 ---------- */
  function todayMin() { return Math.floor(tr.today().ms / 60000); }
  function welcome() {
    var back = tr.hasProgress();
    $('cLabel').textContent = '值班台';
    $('wHow').hidden = back;
    $('wMini').hidden = !back;
    $('mLit').textContent = tr.unlockedCount();
    $('mToday').textContent = todayMin();
    $('mStreak').textContent = tr.streak();
    if (back) {
      $('wT').textContent = T.welcomeBackT;
      $('wD').textContent = F(T.welcomeBackD, tr.unlockedCount(), todayMin());
      $('wBtn').textContent = tr.stage() === 'look' ? T.welcomeBackS1 : T.welcomeBackBtn;
      $('wSkip').hidden = tr.stage() !== 'look';
    } else {
      $('wT').textContent = T.welcomeNewT;
      $('wD').textContent = T.welcomeNewD;
      $('wBtn').textContent = T.welcomeNewBtn;
      $('wSkip').hidden = false;
    }
    show('welcome');
  }
  $('wBtn').addEventListener('click', function () {
    player.ensure();
    if (tr.stage() === 'look') startS1(); else beginShift();
  });
  $('wSkip').addEventListener('click', function () {
    player.ensure();
    tr.completeStage('look');
    ev('morse_skip_intro', {});
    beginShift();
  });

  /* =====================================================================
     第一階段：看（入門，固定 3 步，約 5 分鐘）
     ===================================================================== */
  var S1_LETTERS = ['E', 'T', 'A', 'N'];   /* 刻意不用 K、M：第二階段的字從一開始就只用耳朵學 */
  function patHTML(ch) {
    return M.CODE[ch].split('').map(function (s) { return '<i class="' + (s === '.' ? 'dot' : 'dash') + '"></i>'; }).join('');
  }
  function lightPat(el) {
    var bits = el ? el.querySelectorAll('i') : [];
    return function (on, kind, i, e) { var b = bits[e.si]; if (b) b.classList.toggle('on', on); };
  }
  var heard = {};
  function startS1() {
    ev('tutorial_begin', {});
    heard = {};
    $('cLabel').textContent = '日誌第一頁';
    $('s1aNext').disabled = true;
    $('ddDit').classList.remove('heard'); $('ddDah').classList.remove('heard');
    show('s1a', true);
    bringConsole();
  }
  function ddPress(btn, kind) {
    btn.classList.add('heard');
    heard[kind] = 1;
    play(kind === '.' ? 'E' : 'T', { eff: 0, onTone: lightPat(btn.querySelector('.pat')) });
    if (heard['.']) { if (heard['-']) $('s1aNext').disabled = false; }
  }
  $('ddDit').addEventListener('click', function () { ddPress(this, '.'); });
  $('ddDah').addEventListener('click', function () { ddPress(this, '-'); });
  $('s1aNext').addEventListener('click', function () { s1b(); });

  var cardHeard = {};
  function s1b() {
    cardHeard = {};
    var box = $('s1Cards');
    box.innerHTML = S1_LETTERS.map(function (ch) {
      return '<button type="button" class="card" data-ch="' + ch + '" aria-label="字母 ' + ch + '"><b>' + ch + '</b><span class="pat">' + patHTML(ch) + '</span></button>';
    }).join('');
    box.querySelectorAll('.card').forEach(function (c) {
      c.addEventListener('click', function () {
        var ch = c.getAttribute('data-ch');
        cardHeard[ch] = 1; c.classList.add('heard');
        play(ch, { eff: 0, onTone: lightPat(c.querySelector('.pat')) });
        $('s1bNext').disabled = Object.keys(cardHeard).length < S1_LETTERS.length;
      });
    });
    $('s1bNext').disabled = true;
    show('s1b', true);
  }
  $('s1bNext').addEventListener('click', function () { s1Quiz(2); });

  /* 小考：step 2 看著聽（4 題）、step 3 只用耳朵（6 題） */
  var q1 = null;
  function s1Quiz(step) {
    var n = step === 2 ? 4 : 6, seq = [], last = null;
    while (seq.length < n) {
      var pool = S1_LETTERS.filter(function (c) { return c !== last; });
      if (step === 2) pool = pool.filter(function (c) { return seq.indexOf(c) < 0; });
      var c = pool[Math.floor(Math.random() * pool.length)];
      seq.push(c); last = c;
    }
    q1 = { step: step, seq: seq, i: 0, ok: 0, busy: false };
    var steps = $('s1qSteps').children;
    for (var k = 0; k < 3; k++) steps[k].classList.toggle('on', k < step);
    $('s1qK').textContent = '第一頁 ' + step + '／3';
    $('s1qT').textContent = step === 2 ? T.s1bT : T.s1cT;
    $('s1qD').textContent = step === 2 ? T.s1bQuizD : T.s1cD;
    var keys = $('s1Keys');
    keys.style.setProperty('--n', 4);
    keys.innerHTML = S1_LETTERS.map(function (ch) { return '<button type="button" class="key" data-k="' + ch + '">' + ch + '</button>'; }).join('');
    keys.querySelectorAll('.key').forEach(function (b) { b.addEventListener('click', function () { s1Answer(b.getAttribute('data-k')); }); });
    show('s1q', true);
    s1Ask();
  }
  function s1Ask() {
    var ch = q1.seq[q1.i];
    q1.busy = false;
    $('s1Count').textContent = F(T.s1Q, q1.i + 1, q1.seq.length);
    $('s1Status').textContent = '';
    $('s1Status').className = 'status';
    var pat = $('s1Pat');
    if (q1.step === 2) { pat.innerHTML = patHTML(ch); pat.hidden = false; }
    else { pat.innerHTML = ''; pat.hidden = true; }
    $('s1Keys').querySelectorAll('.key').forEach(function (b) { b.className = 'key'; });
    wait(250).then(function () { s1Play(); });
  }
  function s1Play() {
    var ch = q1.seq[q1.i];
    play(ch, { eff: 0, onTone: q1.step === 2 ? lightPat($('s1Pat')) : null });
  }
  $('s1Disc').addEventListener('click', function () { if (q1) s1Play(); });
  function s1Answer(k) {
    if (!q1) return;
    if (q1.busy) return;
    q1.busy = true;
    var ch = q1.seq[q1.i], ok = k === ch;
    var b = $('s1Keys').querySelector('[data-k="' + k + '"]');
    var st = $('s1Status');
    if (ok) { q1.ok++; b.classList.add('ok'); st.className = 'status ok'; st.innerHTML = F(T.s1Right, '<b>' + ch + '</b>'); }
    else {
      b.classList.add('no');
      var rb = $('s1Keys').querySelector('[data-k="' + ch + '"]'); if (rb) rb.classList.add('ans');
      st.className = 'status no'; st.innerHTML = F(T.s1Wrong, '<b>' + ch + '</b>');
    }
    var go = function () {
      q1.i++;
      if (q1.i < q1.seq.length) s1Ask();
      else if (q1.step === 2) s1Quiz(3);
      else s1Finish();
    };
    if (ok) wait(650).then(go);
    else wait(300).then(function () { return play(ch, { eff: 0 }); }).then(function () { return wait(500); }).then(go);
  }
  function s1Finish() {
    q1 = null;
    tr.completeStage('look');
    ev('tutorial_complete', {});
    show('s1done', true);
  }
  $('s1Done').addEventListener('click', function () { beginShift(); });

  /* =====================================================================
     第二階段：聽（Koch 法）
     ===================================================================== */
  var mode = tr.get('mode', 'koch');
  var GROUP_AT = 5;
  function groupOpen() { return tr.unlockedCount() >= GROUP_AT; }
  if (!groupOpen()) mode = 'koch';
  function level() { return 'l' + pad2(Math.max(1, tr.unlockedCount() - 1)); }

  function renderModeSeg() {
    var seg = $('modeSeg'), inRound = current === 'play';
    seg.hidden = tr.stage() === 'look' ? true : current === 's1done';
    seg.querySelectorAll('button').forEach(function (b) {
      var m = b.getAttribute('data-mode');
      b.setAttribute('aria-pressed', m === mode ? 'true' : 'false');
      b.disabled = inRound ? m !== mode : (m === 'group' ? !groupOpen() : false);
      b.title = m === 'group' ? (groupOpen() ? '' : T.modeGroupLock) : '';
    });
  }
  $('modeSeg').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (b.disabled) return;
    var m = b.getAttribute('data-mode');
    if (m === mode) return;
    mode = m; tr.set('mode', m);
    ev('game_settings', { setting: 'mode_' + m });
    renderModeSeg();
  });

  /* 新燈介紹：第一班 K＋M；之後每點亮一盞，先聽新字 */
  var introFor = null;
  function needsIntro() {
    var newest = tr.newest(), it = tr.item(newest);
    return it.n === 0;
  }
  function beginShift() {
    applySettings();
    if (needsIntro()) showIntro(); else startRound();
  }
  function showIntro() {
    var first = tr.unlockedCount() === 2 ? tr.item(M.KOCH[0]).n === 0 : false;
    introFor = first ? M.KOCH.slice(0, 2) : [tr.newest()];
    var g = $('introGlyph');
    g.textContent = introFor.join('');
    g.classList.toggle('pair', introFor.length > 1);
    $('introT').textContent = first ? T.newLampK + '：K 與 M' : T.newLampK + '：' + introFor[0];
    $('introD').textContent = first ? T.newLampFirst : T.newLampD;
    $('cLabel').textContent = '值班台';
    show('intro', true);
    bringConsole();
    introPlay();
  }
  var introToken = 0;
  function introPlay() {
    var my = ++introToken, seq = [];
    introFor.forEach(function (ch) { seq.push(ch, ch, ch); });
    var i = 0;
    (function step() {
      if (my !== introToken) return;
      if (current !== 'intro') return;
      if (i >= seq.length) return;
      var ch = seq[i++];
      play(ch).then(function () { return wait(i % 3 === 0 ? 900 : 550); }).then(step);
    })();
  }
  $('introAgain').addEventListener('click', function () { introPlay(); });
  $('introGo').addEventListener('click', function () { introToken++; player.stop(); startRound(); });

  /* 一班 */
  var R = null;
  function startRound() {
    applySettings();
    var group = mode === 'group' ? groupOpen() : false;
    R = {
      group: group,
      size: group ? 9 : 25,
      i: 0,
      cur: null,
      input: [],
      busy: false,
      endAt: 0,
      lastAct: Date.now(),
      marks: []
    };
    tr.roundBegin();
    var h = hg(); if (h) h.roundStart({ option: group ? 'group' : 'koch', level: level() });
    $('cLabel').textContent = '值班中';
    $('slots').hidden = !group;
    buildKeys();
    buildTicks();
    show('play');
    bringConsole();
    wait(350).then(ask);
  }
  function buildKeys() {
    var unl = tr.unlocked(), newest = tr.newest();
    var list = M.KEY_ORDER.filter(function (c) { return unl.indexOf(c) > -1; });
    var box = $('keys');
    box.classList.toggle('few', list.length <= 4);
    box.style.setProperty('--n', Math.min(4, list.length));
    box.innerHTML = list.map(function (c) {
      return '<button type="button" class="key' + (c === newest ? ' fresh' : '') + '" data-k="' + c + '" aria-label="' + c + '">' + c + '</button>';
    }).join('');
  }
  $('keys').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.key') : null;
    if (b) answer(b.getAttribute('data-k'));
  });
  function buildTicks() {
    var s = '';
    for (var i = 0; i < R.size; i++) s += '<i></i>';
    $('ticks').innerHTML = s;
  }
  function tick(i, cls) { var t = $('ticks').children[i]; if (t) t.className = cls; }
  function setStatus(html, cls) { var s = $('status'); s.className = 'status' + (cls ? ' ' + cls : ''); s.innerHTML = html; }

  function ask() {
    if (!R) return;
    if (current !== 'play') return;
    R.busy = false; R.input = [];
    $('keys').querySelectorAll('.key').forEach(function (b) { b.classList.remove('ok', 'no', 'ans'); });
    tick(R.i, 'now');
    if (R.group) {
      R.cur = [tr.pick(), tr.pick(), tr.pick()];
      paintSlots();
      setStatus(T.groupPrompt);
    } else {
      R.cur = tr.pick();
      setStatus(T.pickPrompt);
    }
    replay();
  }
  function replay() {
    if (!R) return;
    var text = R.group ? R.cur.join('') : R.cur;
    R.endAt = 0;
    play(text).then(function (done) { if (done) { if (R) R.endAt = Date.now(); } });
  }
  $('disc').addEventListener('click', function () { if (R) { if (!R.busy) replay(); } });
  function paintSlots(result) {
    var sl = $('slots').children;
    for (var i = 0; i < 3; i++) {
      var ch = R.input[i] || '';
      sl[i].textContent = ch;
      sl[i].className = '';
      if (!result) { if (i === R.input.length) sl[i].className = 'cur'; }
      else if (ch !== R.cur[i]) sl[i].className = 'no';
    }
  }
  function spend() {
    var now = Date.now(), dt = Math.min(now - R.lastAct, 20000);
    R.lastAct = now;
    tr.addTime(dt);
    paintToday();
  }
  function answer(k) {
    if (!R) return;
    if (R.busy) return;
    if (current !== 'play') return;
    var rt = R.endAt ? Date.now() - R.endAt : 0;
    if (R.group) { groupInput(k); return; }
    R.busy = true;
    spend();
    var ok = k === R.cur;
    tr.record(R.cur, ok, { rt: rt, answer: k });
    var b = $('keys').querySelector('[data-k="' + k + '"]');
    tick(R.i, ok ? 'ok' : 'no');
    if (ok) {
      if (b) b.classList.add('ok');
      setStatus(T.right + '，<b>' + k + '</b>', 'ok');
      R.i++;
      wait(420).then(next);
    } else {
      if (b) b.classList.add('no');
      var rb = $('keys').querySelector('[data-k="' + R.cur + '"]'); if (rb) rb.classList.add('ans');
      setStatus(F(T.wrongIs, '<b>' + R.cur + '</b>'), 'no');
      R.i++;
      var c = R.cur;
      wait(250).then(function () { return play(c); }).then(function () { return wait(650); }).then(next);
    }
  }
  function groupInput(k) {
    if (k === 'BACK') { R.input.pop(); paintSlots(); return; }
    if (R.input.length >= 3) return;
    R.input.push(k);
    paintSlots();
    if (R.input.length < 3) return;
    R.busy = true;
    spend();
    var rt = R.endAt ? Date.now() - R.endAt : 0, nOk = 0;
    for (var i = 0; i < 3; i++) {
      var ok = R.input[i] === R.cur[i];
      if (ok) nOk++;
      tr.record(R.cur[i], ok, { rt: rt / 3, answer: R.input[i] });
    }
    paintSlots(true);
    tick(R.i, nOk === 3 ? 'ok' : 'no');
    R.i++;
    if (nOk === 3) { setStatus(T.right + '，<b>' + R.cur.join('') + '</b>', 'ok'); wait(650).then(next); }
    else {
      setStatus(F(T.wrongGroup, '<b>' + R.cur.join('') + '</b>'), 'no');
      var c = R.cur.join('');
      wait(300).then(function () { return play(c); }).then(function () { return wait(900); }).then(next);
    }
  }
  function next() {
    if (!R) return;
    if (current !== 'play') return;
    if (R.i >= R.size) finishRound(); else ask();
  }
  $('quitBtn').addEventListener('click', function () { quitRound(); welcome(); });
  function quitRound() {
    if (!R) return;
    player.stop();
    tr.roundEnd({ gate: false });
    var h = hg(); if (h) h.roundEnd({ result: 'quit' });
    R = null;
    paintAll();
  }

  /* 結算 */
  var lastUnlock = null;
  function finishRound() {
    var group = R.group;
    R = null;
    var res = tr.roundEnd();
    var h = hg();
    if (h) h.roundEnd({ result: 'complete', item_count: res.n, correct_count: res.c, score: pct(res.acc) });
    $('cLabel').textContent = '交班';
    $('rBig').innerHTML = F(T.resultT, '<span class="type">' + res.c, res.n + '</span>');
    $('rRow').innerHTML = '<span>' + F(T.resultAcc, '<b>' + pct(res.acc) + '</b>') + '</span>' +
      (res.rtMed ? '<span>' + F(T.resultRt, '<b>' + (res.rtMed / 1000).toFixed(1) + '</b>') + '</span>' : '');
    var un = $('rUnlock'), msg = $('rMsg');
    un.innerHTML = ''; msg.textContent = '';
    lastUnlock = null;
    if (res.unlocked.length) {
      var ch = res.unlocked[0], n = tr.unlockedCount();
      lastUnlock = ch;
      var entry = T.diary[n];
      un.innerHTML = '<div class="unlock"><div class="glyph" aria-hidden="true">' + ch + '</div><div><p><b>' + F(T.resultPass, n) + '</b></p>' +
        (entry ? '<p class="diary-q" style="margin-top:8px">' + entry + '</p>' : '') + '</div></div>';
      ev('game_unlock', { unlock_id: 'koch_' + level(), level: level() });
      if (n === M.KOCH.length) ev('game_unlock', { unlock_id: 'all_lamps', level: level() });
      paintScene(n - 1);
      wait(reduce ? 0 : 500).then(function () { play(ch); });
    } else if (tr.unlockedCount() >= M.KOCH.length) {
      msg.textContent = T.resultAll;
    } else {
      msg.textContent = F(T.resultMiss, group ? 27 : 25, Math.ceil((group ? 27 : 25) * 0.9));
    }
    $('rShare').hidden = tr.unlockedCount() < 3;
    $('rCard').hidden = true; $('rCard').innerHTML = '';
    show('result', true);
    paintAll();
  }
  $('rNext').addEventListener('click', function () { beginShift(); });
  $('rRest').addEventListener('click', function () {
    welcome();
    $('wD').textContent = T.restMsg;
  });
  $('rShare').addEventListener('click', function () { makeCard($('rShare'), $('rCard')); });

  /* =====================================================================
     進度圖卡（games §6-1）：1080×1350 直式、中央淡浮水印、底部金色品牌列
     ===================================================================== */
  var C = T.card, cardUrls = {};
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function loadImg(src) { return new Promise(function (ok, ng) { var i = new Image(); i.onload = function () { ok(i); }; i.onerror = ng; i.src = src; }); }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function tierText(n) { for (var i = 0; i < C.tiers.length; i++) { if (n >= C.tiers[i][0]) return C.tiers[i][1]; } return C.tiers[C.tiers.length - 1][1]; }
  function cardStats() {
    var t = tr.totals();
    return { n: tr.unlockedCount(), streak: tr.streak(), total: t.n, acc: t.n ? pct(t.c / t.n) : 0, d: tr.dayKey() };
  }

  /* 把頁面上的海岸插畫轉成圖片（樣式寫進屬性，才不依賴外部 CSS）；失敗時回傳 null，改畫簡化版 */
  async function sceneImage() {
    try {
      var src = $('scene').querySelector('svg'), svg = src.cloneNode(true), n = tr.unlockedCount();
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svg.setAttribute('width', '1200'); svg.setAttribute('height', '600');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.querySelectorAll('.lamp').forEach(function (g, i) {
        var lit = i < n, halo = g.querySelector('.halo'), core = g.querySelector('.core');
        if (halo) halo.setAttribute('opacity', lit ? '0.85' : '0');
        if (core) { core.setAttribute('fill', lit ? '#F2A31B' : '#ffffff'); core.setAttribute('stroke', lit ? '#ffffff' : '#8E93B8'); core.setAttribute('stroke-width', '1.2'); }
      });
      svg.querySelectorAll('.glow').forEach(function (e) { e.setAttribute('opacity', '1'); });
      svg.querySelectorAll('.beam').forEach(function (e) { e.setAttribute('opacity', '0.45'); });
      var xml = new XMLSerializer().serializeToString(svg);
      var img = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml));
      /* 先畫在暫存畫布，確認沒有被瀏覽器標成不可輸出 */
      var tmp = document.createElement('canvas'); tmp.width = 1200; tmp.height = 600;
      var tc = tmp.getContext('2d'); tc.drawImage(img, 0, 0, 1200, 600); tc.getImageData(0, 0, 1, 1);
      return tmp;
    } catch (e) { return null; }
  }
  function sceneFallback(c, x, y, w, h) {
    var g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#C6DCF2'); g.addColorStop(0.55, '#FBE7D2'); g.addColorStop(0.56, '#E3EAF5'); g.addColorStop(1, '#F3D2DB');
    c.fillStyle = g; c.fillRect(x, y, w, h);
    var tx = x + w * 0.78, ty = y + h * 0.18;
    c.fillStyle = '#ffffff'; c.fillRect(tx, ty + 40, 34, h * 0.5);
    c.fillStyle = '#C8102E'; c.fillRect(tx, ty + 70, 34, 18); c.fillRect(tx, ty + 120, 34, 18);
    c.fillStyle = '#F2A31B'; c.beginPath(); c.arc(tx + 17, ty + 26, 14, 0, 7); c.fill();
  }

  async function drawCard(st) {
    var SANS = cssVar('--sans'), SERIF = cssVar('--serif'), TYPE = cssVar('--type');
    var lit = M.KOCH.slice(0, st.n).join('');
    var TXT = [C.game, C.title, C.lit, C.unit, C.streak, C.dayUnit, C.total, C.charUnit, C.acc, C.lamps, C.brand, C.wm, C.url, C.cta, tierText(st.n)].join('') + '0123456789%／-';
    /* 字型最多等 1.5 秒；沒載完的字用系統字型補 */
    try {
      await Promise.race([new Promise(function (ok) { setTimeout(ok, 1500); }), Promise.all([
        ['400 30px ' + SANS, TXT], ['700 40px ' + SANS, TXT], ['700 46px ' + SERIF, TXT],
        ['700 200px ' + TYPE, '0123456789' + lit + st.d]
      ].map(function (f) { return document.fonts.load(f[0], f[1]); }))]);
    } catch (e) {}
    var logo = null; try { logo = await loadImg('/icons/logo-knitting-240.webp'); } catch (e) {}
    var scene = await sceneImage();

    var W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d'), INK = '#1B2430', MUTE = '#5E6676', SIG = '#C8102E', LAMP = '#F2A31B', RULE = '#E4E7EE', GOLD = '#C9A25C';
    var X = 72, IW = W - 2 * X;
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
    c.textBaseline = 'alphabetic';

    /* 頂端：遊戲名＋日期 */
    c.fillStyle = INK; c.font = '700 46px ' + SERIF; c.fillText(C.game, X, 112);
    c.fillStyle = MUTE; c.font = '700 30px ' + TYPE; c.textAlign = 'right'; c.fillText(st.d.replace(/-/g, '.'), W - X, 110); c.textAlign = 'left';
    c.font = '500 30px ' + SANS; c.fillText(C.title, X, 162);

    /* 海岸插畫 */
    var sy = 196, sh = 326;
    c.save(); rr(c, X, sy, IW, sh, 32); c.clip();
    if (scene) { var crop = 1200 * sh / IW; c.drawImage(scene, 0, 360 - crop / 2 - 40, 1200, crop, X, sy, IW, sh); }
    else sceneFallback(c, X, sy, IW, sh);
    c.restore();

    /* 大字：已點亮 N／41 盞燈 */
    var by = 736;
    c.fillStyle = MUTE; c.font = '500 32px ' + SANS; c.fillText(C.lit, X, 590);
    c.fillStyle = INK; c.font = '700 200px ' + TYPE; var num = String(st.n); c.fillText(num, X - 8, by);
    var nw = c.measureText(num).width;
    c.font = '700 52px ' + SANS; c.fillText(C.unit, X + nw + 10, by - 12);
    c.fillStyle = SIG; c.font = '700 40px ' + SERIF; c.fillText(tierText(st.n), X, by + 72);

    /* 三格數字 */
    var my = 836, mh = 120;
    c.strokeStyle = RULE; c.lineWidth = 2; rr(c, X, my, IW, mh, 24); c.stroke();
    [[String(st.streak), C.dayUnit, C.streak], [String(st.total), C.charUnit, C.total], [String(st.acc), '%', C.acc]].forEach(function (k, i) {
      var cx = X + IW / 6 * (2 * i + 1);
      c.font = '700 54px ' + TYPE; var aw = c.measureText(k[0]).width;
      c.font = '500 26px ' + SANS; var bw = c.measureText(k[1]).width;
      var sx = cx - (aw + 6 + bw) / 2;
      c.fillStyle = INK; c.font = '700 54px ' + TYPE; c.fillText(k[0], sx, my + 62);
      c.fillStyle = MUTE; c.font = '500 26px ' + SANS; c.fillText(k[1], sx + aw + 6, my + 62);
      c.textAlign = 'center'; c.font = '400 25px ' + SANS; c.fillText(k[2], cx, my + 98); c.textAlign = 'left';
      if (i) { c.fillStyle = RULE; c.fillRect(X + IW / 3 * i - 1, my + 24, 2, mh - 48); }
    });

    /* 41 盞燈：已點亮的顯示字元 */
    var gy = 990, cols = 14, gap = 8, d = (IW - (cols - 1) * gap) / cols;
    M.KOCH.forEach(function (ch, i) {
      var r = i % cols, row = Math.floor(i / cols), cx = X + r * (d + gap) + d / 2, cy = gy + row * (d + gap) + d / 2;
      if (i < st.n) {
        var g = c.createRadialGradient(cx, cy, 2, cx, cy, d / 2);
        g.addColorStop(0, '#FFD27A'); g.addColorStop(0.75, LAMP); g.addColorStop(1, '#E99A12');
        c.fillStyle = g; c.beginPath(); c.arc(cx, cy, d / 2, 0, 7); c.fill();
        c.fillStyle = INK; c.font = '700 30px ' + TYPE; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, cx, cy + 2);
        c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      } else {
        c.setLineDash([5, 5]); c.strokeStyle = '#C3C8DA'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy, d / 2 - 1, 0, 7); c.stroke(); c.setLineDash([]);
      }
    });

    /* 中央淡浮水印 */
    c.save(); c.translate(W / 2, 720); c.rotate(-24 * Math.PI / 180); c.globalAlpha = 0.08; c.fillStyle = INK; c.textAlign = 'center';
    var wf = 160; c.font = '700 ' + wf + 'px ' + SANS; var ww = c.measureText(C.wm).width; if (ww > 780) { wf = Math.floor(wf * 780 / ww); c.font = '700 ' + wf + 'px ' + SANS; }
    c.fillText(C.wm, 0, 0); c.font = '500 46px ' + SANS; c.fillText('games.knittinghiyori.com', 0, 80); c.restore();

    /* 底部金色品牌列 */
    var barH = 124; c.fillStyle = GOLD; c.fillRect(0, H - barH, W, barH);
    var lx = 56, ls = 84, ly = H - barH + (barH - ls) / 2;
    if (logo) { c.save(); rr(c, lx, ly, ls, ls, 16); c.clip(); c.drawImage(logo, lx, ly, ls, ls); c.restore(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3; rr(c, lx, ly, ls, ls, 16); c.stroke(); }
    c.fillStyle = '#ffffff'; c.textBaseline = 'middle';
    var tx = lx + ls + 22; c.font = '700 38px ' + SANS; c.fillText(C.brand, tx, H - barH / 2 - 18);
    c.font = '500 26px ' + SANS; c.fillText(C.url, tx, H - barH / 2 + 24);
    c.font = '700 30px ' + SANS; c.textAlign = 'right'; c.fillText(C.cta, W - 56, H - barH / 2); c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    return cv;
  }

  async function makeCard(btn, out) {
    if (tr.unlockedCount() < 3) return;
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = C.making;
    var key = out.id, st = cardStats();
    try {
      var cv = await drawCard(st);
      var blob = await new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', 0.92); });
      if (cardUrls[key]) URL.revokeObjectURL(cardUrls[key]);
      var url = cardUrls[key] = URL.createObjectURL(blob), name = 'morse-code-' + st.d + '.jpg';
      var file = null, canShare = false;
      try { file = new File([blob], name, { type: 'image/jpeg' }); } catch (e) {}
      try { canShare = file ? (navigator.canShare ? navigator.canShare({ files: [file] }) : false) : false; } catch (e) {}
      out.innerHTML = '<img class="card-img" src="' + url + '" width="1080" height="1350" alt="' + F(C.alt, st.n, st.streak, st.total, st.acc) + '">' +
        '<div class="card-btns">' + (canShare ? '<button type="button" class="btn" data-card="share">' + C.share + '</button>' : '') +
        '<a class="btn line" data-card="dl" href="' + url + '" download="' + name + '" data-google-vignette="false">' + C.download + '</a>' +
        '<button type="button" class="btn line" data-card="copy">' + C.copy + '</button></div>' +
        '<p class="card-hint">' + C.hint + '</p>';
      out.hidden = false;
      out.querySelector('[data-card=dl]').addEventListener('click', function () { ev('export', { method: 'image', content_type: 'result' }); });
      out.querySelector('[data-card=copy]').addEventListener('click', function () {
        var b = this, h = hg(); if (h) h.share('copy_link', 'result');
        try { navigator.clipboard.writeText(shareText() + ' ' + shareUrl()).then(function () { b.textContent = C.copied; }, function () { b.textContent = shareUrl(); }); }
        catch (e) { b.textContent = shareUrl(); }
      });
      if (canShare) out.querySelector('[data-card=share]').addEventListener('click', function () {
        var h = hg(); if (h) h.share('native', 'result');
        navigator.share({ files: [file], text: shareText() + ' ' + shareUrl() }).catch(function (er) {
          if (er) { if (er.name === 'AbortError') ev('share_cancel', { method: 'native', content_type: 'result' }); }
        });
      });
    } catch (e) { out.hidden = false; out.textContent = C.fail; }
    btn.disabled = false; btn.textContent = label;
  }
  $('logCardBtn').addEventListener('click', function () { makeCard($('logCardBtn'), $('logCard')); });
  function paintCardEntry() {
    var ok = tr.unlockedCount() >= 3;
    $('logCardBtn').hidden = !ok;
    $('logCardNote').hidden = ok;
  }

  /* ---------- 鍵盤 ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    var k = e.key;
    if (current === 'play') {
      if (k === ' ' || k === 'Enter') {
        if (tag === 'button') { if (e.target.id !== 'disc') return; }
        e.preventDefault(); if (R) { if (!R.busy) replay(); } return;
      }
      if (k === 'Backspace') { if (R) { if (R.group) { e.preventDefault(); groupInput('BACK'); } } return; }
      var up = k.length === 1 ? k.toUpperCase() : '';
      if (up) { if (tr.isUnlocked(up)) { e.preventDefault(); answer(up); } }
      return;
    }
    if (current === 's1q') {
      var u = k.length === 1 ? k.toUpperCase() : '';
      if (S1_LETTERS.indexOf(u) > -1) { e.preventDefault(); s1Answer(u); }
      else if (k === ' ') { if (tag !== 'button') { e.preventDefault(); s1Play(); } }
    }
  });

  /* =====================================================================
     守燈日誌
     ===================================================================== */
  function paintLampGrid() {
    var n = tr.unlockedCount();
    $('lampGrid').innerHTML = M.KOCH.map(function (ch, i) {
      var lit = i < n, box = lit ? tr.item(ch).box : 0, pips = '';
      if (lit) { for (var b = 1; b <= 4; b++) pips += '<i' + (box >= b ? ' class="on"' : '') + '></i>'; }
      return '<li><button type="button" class="' + (lit ? 'lit' : '') + '" data-ch="' + (lit ? ch : '') + '"' + (lit ? '' : ' disabled') +
        ' aria-label="' + (lit ? F(T.lampAria, i + 1, ch, box) : F(T.lampLockedAria, i + 1)) + '">' + (lit ? ch : '') + '</button>' +
        '<span class="pips" aria-hidden="true">' + pips + '</span><span class="n">' + pad2(i + 1) + '</span></li>';
    }).join('');
  }
  $('lampGrid').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    var ch = b.getAttribute('data-ch');
    if (!ch) return;
    if (current === 'play') return;
    play(ch);
  });
  function paintToday() {
    var m = todayMin();
    $('todayMin').textContent = m;
    $('todayPill').hidden = tr.today().ms < 60000;
    $('stToday').textContent = m;
    $('stGoal').style.width = Math.min(100, tr.today().ms / 6000) + '%';
  }
  function paintStats() {
    paintToday();
    var t = tr.totals();
    $('stStreak').textContent = tr.streak();
    $('stTotal').textContent = t.n;
    $('stAcc').textContent = t.n ? pct(t.c / t.n) + '%' : '—';
  }
  function paintChart() {
    var D = tr.days(14), W = 560, H = 150, L = 26, Rm = 4, Tp = 12, B = 22;
    var max = Math.max(10, Math.ceil(Math.max.apply(null, D.map(function (d) { return d.ms / 60000; })) / 5) * 5);
    var bw = (W - L - Rm) / D.length;
    var Y = function (v) { return Tp + (H - Tp - B) * (1 - v / max); };
    var s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + T.chartAria + '">';
    [0, max / 2, max].forEach(function (v) {
      s += '<line x1="' + L + '" x2="' + (W - Rm) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E4E7EE" stroke-width="1"/>' +
        '<text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + '</text>';
    });
    D.forEach(function (d, i) {
      var m = d.ms / 60000, x = L + i * bw + 3, w = bw - 6, y = Y(m), h = Math.max(0, Y(0) - y);
      var zero = m < 0.05;
      if (zero) { y = Y(0) - 3; h = 3; }
      var tip = zero ? F(T.chartTipNone, d.d.slice(5).replace('-', '/')) : F(T.chartTip, d.d.slice(5).replace('-', '/'), m.toFixed(1), d.n, d.n ? pct(d.c / d.n) : 0);
      s += '<rect class="hit" x="' + (L + i * bw) + '" y="' + Tp + '" width="' + bw + '" height="' + (H - Tp - B) + '" data-tip="' + tip + '" tabindex="0" aria-label="' + tip + '"/>';
      s += '<path class="bar' + (zero ? ' zero' : '') + '" d="M' + x + ' ' + (y + h) + ' V' + (y + Math.min(4, h)) + ' Q' + x + ' ' + y + ' ' + (x + Math.min(4, w / 2)) + ' ' + y + ' H' + (x + w - Math.min(4, w / 2)) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + Math.min(4, h)) + ' V' + (y + h) + ' Z"/>';
      if (i === 0 || i === D.length - 1 || i === 7) s += '<text x="' + (L + i * bw + bw / 2) + '" y="' + (H - 4) + '" text-anchor="middle">' + d.d.slice(5).replace('-', '/') + '</text>';
    });
    s += '</svg><div class="tip" id="chartTip" hidden></div>';
    $('chart').innerHTML = s;
  }
  function tipShow(e) {
    var r = e.target, tip = $('chartTip');
    if (!r.getAttribute) return;
    var t = r.getAttribute('data-tip');
    if (!t) return;
    var box = $('chart').getBoundingClientRect(), rb = r.getBoundingClientRect();
    tip.textContent = t; tip.hidden = false;
    var x = rb.left - box.left + rb.width / 2;
    x = Math.max(90, Math.min(box.width - 90, x));
    tip.style.left = x + 'px'; tip.style.top = (rb.top - box.top + 10) + 'px';
  }
  function tipHide() { var t = $('chartTip'); if (t) t.hidden = true; }
  $('chart').addEventListener('mouseover', tipShow);
  $('chart').addEventListener('focusin', tipShow);
  $('chart').addEventListener('mouseleave', tipHide);
  $('chart').addEventListener('focusout', tipHide);

  function paintConf() {
    var list = tr.confusions(4), box = $('confList');
    if (!list.length) { box.innerHTML = '<li style="border:0"><span class="note">' + T.confEmpty + '</span></li>'; return; }
    box.innerHTML = list.map(function (c) {
      return '<li><span><b>' + c.a + '</b><span class="as">' + T.confAs + '</span><b>' + c.b + '</b></span>' +
        '<button type="button" data-a="' + c.a + '" data-b="' + c.b + '">' + F(T.confPlay, c.a, c.b) + '</button></li>';
    }).join('');
  }
  $('confList').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (current === 'play') return;
    play(b.getAttribute('data-a') + ' ' + b.getAttribute('data-b'), { eff: 6 });
    ev('morse_pair_play', {});
  });
  function paintDiary() {
    var n = tr.unlockedCount(), keys = Object.keys(T.diary).map(Number).sort(function (a, b) { return a - b; });
    var shown = keys.filter(function (k, i) { return n >= k ? true : (i === 0 ? true : n >= keys[i - 1]); });
    $('diaryList').innerHTML = shown.map(function (k) {
      var open = n >= k;
      return '<li class="' + (open ? '' : 'locked') + '"><span class="no">' + pad2(k) + '</span><p>' + (open ? T.diary[k] : F(T.diaryLocked, k)) + '</p></li>';
    }).join('');
  }
  function paintAll() {
    paintScene();
    paintLampGrid();
    paintStats();
    paintChart();
    paintConf();
    paintDiary();
    paintCardEntry();
    renderModeSeg();
  }

  /* ---------- 設定 ---------- */
  function bindRange(id, key, dflt, valId, fmt) {
    var el = $(id);
    el.value = tr.get(key, dflt);
    $(valId).textContent = el.value;
    el.addEventListener('input', function () {
      $(valId).textContent = el.value;
      if (key === 'wpm') { if (+$('sEff').value > +el.value) { $('sEff').value = el.value; $('vEff').textContent = el.value; tr.set('eff', +el.value); } }
      if (key === 'eff') { if (+el.value > +$('sWpm').value) { el.value = $('sWpm').value; $(valId).textContent = el.value; } }
      tr.set(key, +el.value);
      applySettings();
    });
    el.addEventListener('change', function () { ev('game_settings', { setting: fmt + '_' + el.value }); });
  }
  bindRange('sWpm', 'wpm', 20, 'vWpm', 'wpm');
  bindRange('sEff', 'eff', 12, 'vEff', 'eff');
  bindRange('sFreq', 'freq', 600, 'vFreq', 'tone');
  bindRange('sVol', 'vol', 60, 'vVol', 'vol');
  $('sFlash').checked = tr.get('flash', true);
  $('sFlash').addEventListener('change', function () { tr.set('flash', this.checked); ev('game_settings', { setting: this.checked ? 'flash_on' : 'flash_off' }); });
  $('sTest').addEventListener('click', function () { if (current !== 'play') play('KM'); });

  var armed = false;
  $('resetBtn').addEventListener('click', function () {
    if (!armed) {
      armed = true; $('resetMsg').textContent = T.resetArm;
      setTimeout(function () { armed = false; if ($('resetMsg').textContent === T.resetArm) $('resetMsg').textContent = ''; }, 4000);
      return;
    }
    armed = false;
    if (R) quitRound();
    tr.reset();
    mode = 'koch';
    ev('morse_progress_reset', {});
    $('resetMsg').textContent = T.resetDone;
    paintAll(); welcome();
  });

  /* ---------- 引擎事件 ---------- */
  tr.on('milestone', function (n) { ev('game_milestone', { milestone: n }); });
  tr.on('goal', function (streak) { ev('morse_daily_goal', { streak: streak }); });

  /* ---------- 分享 ---------- */
  function shareUrl() { return PAGE_URL + '?ref=share'; }
  function shareText() { return tr.unlockedCount() > 2 ? F(T.share, tr.unlockedCount()) : T.shareNew; }
  document.querySelectorAll('[data-share]').forEach(function (b) {
    b.addEventListener('click', function () {
      var m = b.getAttribute('data-share'), u = encodeURIComponent(shareUrl()), tx = encodeURIComponent(shareText() + ' ' + shareUrl()), link = '';
      var type = tr.unlockedCount() > 2 ? 'result' : 'game';
      var h = hg(); if (h) h.share(m, type);
      if (m === 'line') link = 'https://social-plugins.line.me/lineit/share?url=' + u;
      else if (m === 'facebook') link = 'https://www.facebook.com/sharer/sharer.php?u=' + u;
      else if (m === 'threads') link = 'https://www.threads.net/intent/post?text=' + tx;
      else if (m === 'x') link = 'https://twitter.com/intent/tweet?text=' + tx;
      else if (m === 'telegram') link = 'https://t.me/share/url?url=' + u;
      if (link) { window.open(link, '_blank', 'noopener'); return; }
      var done = function () { $('copyBtn').textContent = T.copied; };
      try { navigator.clipboard.writeText(shareText() + ' ' + shareUrl()).then(done, function () { $('copyBtn').textContent = shareUrl(); }); }
      catch (e) { $('copyBtn').textContent = shareUrl(); }
    });
  });

  /* ---------- 聯盟連結：沒填就不顯示 ---------- */
  (function () {
    var L = window.MORSE_LINKS || {}, any = false;
    document.querySelectorAll('[data-aff]').forEach(function (a) {
      var u = L[a.getAttribute('data-aff')];
      if (u) { a.href = u; a.hidden = false; any = true; }
    });
    $('affDisc').hidden = !any;
  })();

  /* ---------- 開始 ---------- */
  buildScene();
  paintAll();
  welcome();
  if (DEBUG) window.__morse = { tr: tr, player: player, show: show, cur: function () { return R ? R.cur : null; }, finishRound: function () { if (R) { R.i = R.size; finishRound(); } } };
})();
