/* =====================================================================
   守燈人摩斯日誌｜摩斯內容包：字元表、Koch 順序、Web Audio 發聲
   Koch 順序取自 LCWO 原始碼 inc/functions.php（$kochchar，41 個字元）。
   時間計算依 PARIS 標準（1 單位＝1.2÷WPM 秒）與 Bloom（KE3Z，QEX）
   的 Farnsworth 公式。整份檔案不含「和號」字元。
   ===================================================================== */
(function (root) {
  'use strict';

  var CODE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..',
    J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.',
    S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
    '0': '-----', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..', '9': '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', '/': '-..-.', '=': '-...-'
  };

  var KOCH = ['K', 'M', 'U', 'R', 'E', 'S', 'N', 'A', 'P', 'T', 'L', 'W',
    'I', '.', 'J', 'Z', '=', 'F', 'O', 'Y', ',', 'V', 'G', '5', '/', 'Q', '9', '2',
    'H', '3', '8', 'B', '?', '4', '7', 'C', '1', 'D', '6', '0', 'X'];

  /* 鍵盤排序：字母、數字、標點 */
  var KEY_ORDER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890.,?/='.split('');

  /* ---------- 時間 ---------- */
  function timing(wpm, eff) {
    var unit = 1.2 / wpm;               /* 秒 */
    var gapUnit = unit;                 /* 字元間、字間的單位 */
    if (eff) {
      if (eff < wpm) gapUnit = unit * (50 * wpm - 31 * eff) / (19 * eff);
    }
    return { unit: unit, charGap: 3 * gapUnit, wordGap: 7 * gapUnit };
  }

  /* ---------- 發聲 ---------- */
  function Player() {
    this.ctx = null; this.out = null;
    this.freq = 600; this.wpm = 20; this.eff = 12; this.vol = 0.5;
    this.timers = []; this.nodes = []; this.token = 0;
  }
  Player.prototype.ensure = function () {
    if (!this.ctx) {
      try { if (root.navigator ? root.navigator.audioSession : null) root.navigator.audioSession.type = 'playback'; } catch (e) {} /* iOS 16.4+：靜音鍵打開也照樣出聲 */
      var AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      var comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12; comp.ratio.value = 3;
      this.out = this.ctx.createGain();
      this.out.gain.value = this.vol;
      this.out.connect(comp); comp.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
    return this.ctx;
  };
  Player.prototype.setVolume = function (v) { this.vol = v; if (this.out) this.out.gain.value = v; };
  Player.prototype.stop = function () {
    this.token++;
    this.timers.forEach(function (t) { clearTimeout(t); });
    this.timers = [];
    var ctx = this.ctx;
    this.nodes.forEach(function (n) {
      try { n.g.gain.cancelScheduledValues(0); n.g.gain.setValueAtTime(0, ctx.currentTime); n.o.stop(ctx.currentTime + 0.02); } catch (e) {}
    });
    this.nodes = [];
  };

  /* 依序播放字串；空白＝字間。onTone(on, kind, index) 給畫面同步用。
     回傳 Promise，播完（或被 stop）時 resolve。 */
  Player.prototype.play = function (text, opt) {
    opt = opt || {};
    var self = this, ctx = this.ensure();
    this.stop();
    var my = this.token;
    var wpm = opt.wpm || this.wpm;
    var eff = opt.eff === undefined ? this.eff : opt.eff;
    var tm = timing(wpm, eff);
    var events = [], t = 0, chars = String(text).toUpperCase().split('');
    chars.forEach(function (ch, ci) {
      if (ch === ' ') { t += tm.wordGap - tm.charGap; return; }
      var code = CODE[ch];
      if (!code) return;
      code.split('').forEach(function (s, si) {
        var dur = s === '.' ? tm.unit : 3 * tm.unit;
        events.push({ at: t, dur: dur, kind: s, ci: ci, si: si });
        t += dur;
        if (si < code.length - 1) t += tm.unit;
      });
      if (ci < chars.length - 1) t += tm.charGap;
    });
    var total = t;

    if (ctx) {
      var t0 = ctx.currentTime + 0.06, ramp = Math.min(0.006, tm.unit / 5);
      var osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = opt.freq || this.freq;
      g.gain.setValueAtTime(0, t0);
      events.forEach(function (e) {
        var a = t0 + e.at, b = a + e.dur;
        g.gain.setValueAtTime(0, a);
        g.gain.linearRampToValueAtTime(1, a + ramp);
        g.gain.setValueAtTime(1, b - ramp);
        g.gain.linearRampToValueAtTime(0, b);
      });
      osc.connect(g); g.connect(this.out);
      osc.start(t0); osc.stop(t0 + total + 0.05);
      this.nodes.push({ o: osc, g: g });
    }

    var lead = 60;
    if (typeof opt.onTone === 'function') {
      events.forEach(function (e, i) {
        self.timers.push(setTimeout(function () { if (my === self.token) opt.onTone(true, e.kind, i, e); }, lead + e.at * 1000));
        self.timers.push(setTimeout(function () { if (my === self.token) opt.onTone(false, e.kind, i, e); }, lead + (e.at + e.dur) * 1000));
      });
    }
    return new Promise(function (resolve) {
      self.timers.push(setTimeout(function () { resolve(my === self.token); }, lead + total * 1000 + 30));
    });
  };

  /* 單音：入門頁示範「嘀」「噠」 */
  Player.prototype.element = function (kind, opt) {
    return this.play(kind === '.' ? 'E' : 'T', opt);
  };

  root.Morse = {
    CODE: CODE, KOCH: KOCH, KEY_ORDER: KEY_ORDER,
    timing: timing,
    Player: Player
  };
})(window);
