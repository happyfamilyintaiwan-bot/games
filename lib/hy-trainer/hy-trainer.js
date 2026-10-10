/* =====================================================================
   hy-trainer v1.0｜編織日和・實證訓練法系列共用引擎
   負責：階段、門檻解鎖（Koch 式）、交錯出題、間隔複習、進度紀錄。
   不負責：題目內容、聲音、畫面。各遊戲把內容包交給它。
   規則：整份檔案不含「和號」字元（core §3-1 #7），註解只用區塊註解。
   用法見同資料夾 README.md。
   ===================================================================== */
(function (root) {
  'use strict';

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function median(a) {
    if (!a.length) return 0;
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  function assign(t) {
    for (var i = 1; i < arguments.length; i++) {
      var s = arguments[i];
      if (!s) continue;
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
    }
    return t;
  }

  var DEFAULTS = {
    key: 'hy_trainer_v1',          /* localStorage key */
    order: [],                     /* 解鎖順序（項目 id） */
    start: 2,                      /* 一開始解鎖幾個 */
    stages: ['main'],              /* 階段名稱，依序 */
    gate: { min: 25, threshold: 0.9 }, /* 一局至少 min 題、正確率達 threshold 才解鎖下一個 */
    boxes: [0, 120000, 600000, 86400000, 259200000], /* 各複習盒的間隔（毫秒） */
    boxWeight: [6, 3.5, 2, 1.2, 0.7],  /* 盒子越低，出現越頻繁 */
    newBoost: 3,                   /* 新項目前 newExposure 次的加權 */
    newExposure: 12,
    confusionBoost: 0.6,           /* 常被混淆的項目加權 */
    milestones: [1, 10, 50, 100, 500, 1000, 5000, 10000],
    dailyGoalMs: 600000,
    keepRt: 12                     /* 每個項目保留最近幾次反應時間 */
  };

  function fresh(cfg) {
    return {
      v: 1,
      stage: cfg.stages[0],
      stageDone: {},
      unlocked: Math.min(cfg.start, cfg.order.length),
      items: {},
      conf: {},
      days: {},
      total: 0,
      correct: 0,
      goalDays: {},
      settings: {},
      created: dayKey()
    };
  }

  function create(options) {
    var cfg = assign({}, DEFAULTS, options);
    cfg.gate = assign({}, DEFAULTS.gate, options ? options.gate : null);
    var S = fresh(cfg);
    var listeners = {};
    var round = null;
    var lastPicked = null;

    try {
      var raw = root.localStorage.getItem(cfg.key);
      if (raw) S = assign(fresh(cfg), JSON.parse(raw));
    } catch (e) { /* 私密瀏覽或停用儲存：照常運作，只是不保留 */ }

    function save() { try { root.localStorage.setItem(cfg.key, JSON.stringify(S)); } catch (e) {} }
    function emit(name, data) {
      (listeners[name] || []).forEach(function (fn) { try { fn(data); } catch (e) {} });
    }
    function item(id) {
      var it = S.items[id];
      if (!it) { it = S.items[id] = { n: 0, c: 0, box: 0, last: 0, due: 0, rt: [] }; }
      return it;
    }
    function today() {
      var k = dayKey();
      if (!S.days[k]) S.days[k] = { n: 0, c: 0, ms: 0 };
      return S.days[k];
    }
    function unlockedList() { return cfg.order.slice(0, S.unlocked); }
    function confCount(id) {
      var n = 0, k;
      for (k in S.conf) {
        if (k.indexOf(id + '>') === 0) n += S.conf[k];
        else if (k.slice(-(id.length + 1)) === '>' + id) n += S.conf[k] * 0.5;
      }
      return n;
    }

    /* 權重：盒子（間隔複習）× 新項目加權 × 逾期加權 × 混淆加權 */
    function weight(id, now) {
      var it = item(id);
      var w = cfg.boxWeight[it.box] || 1;
      if (it.n < cfg.newExposure) w *= cfg.newBoost;
      if (it.last) {
        var interval = Math.max(cfg.boxes[it.box] || 0, 60000);
        if (now > it.due) w *= 1 + Math.min(3, (now - it.due) / interval);
      }
      var cc = confCount(id);
      if (cc > 0) w *= 1 + cfg.confusionBoost * Math.min(3, cc);
      return w;
    }

    var api = {
      config: cfg,
      dayKey: dayKey,

      /* ---------- 階段 ---------- */
      stage: function () { return S.stage; },
      setStage: function (name) { S.stage = name; save(); },
      completeStage: function (name) {
        S.stageDone[name] = dayKey();
        var i = cfg.stages.indexOf(name);
        if (i > -1) { if (i + 1 < cfg.stages.length) S.stage = cfg.stages[i + 1]; }
        save();
        emit('stage', { done: name, stage: S.stage });
      },
      stageDone: function (name) { return !!S.stageDone[name]; },

      /* ---------- 項目與解鎖 ---------- */
      unlockedCount: function () { return S.unlocked; },
      total: function () { return cfg.order.length; },
      unlocked: unlockedList,
      isUnlocked: function (id) { return cfg.order.indexOf(id) > -1 ? cfg.order.indexOf(id) < S.unlocked : false; },
      nextLocked: function () { return cfg.order[S.unlocked] || null; },
      newest: function () { return cfg.order[S.unlocked - 1]; },
      item: function (id) { return item(id); },
      setUnlocked: function (n) {  /* 測試或「我已經會了」用 */
        S.unlocked = Math.max(Math.min(cfg.start, cfg.order.length), Math.min(n, cfg.order.length));
        save();
      },

      /* ---------- 出題（交錯＋間隔複習） ---------- */
      pick: function (pool) {
        pool = pool || unlockedList();
        if (!pool.length) return null;
        var now = Date.now(), list = [], sum = 0;
        pool.forEach(function (id) {
          if (pool.length > 1) { if (id === lastPicked) return; }
          var w = weight(id, now);
          list.push([id, w]); sum += w;
        });
        var r = Math.random() * sum, i;
        for (i = 0; i < list.length; i++) { r -= list[i][1]; if (r <= 0) break; }
        var pick = list[Math.min(i, list.length - 1)][0];
        lastPicked = pick;
        return pick;
      },

      /* ---------- 作答 ---------- */
      record: function (id, ok, opt) {
        opt = opt || {};
        var now = Date.now(), it = item(id), d = today();
        it.n++; d.n++; S.total++;
        if (ok) { it.c++; d.c++; S.correct++; }
        it.box = ok ? Math.min(it.box + 1, cfg.boxes.length - 1) : 0;
        it.last = now;
        it.due = now + (cfg.boxes[it.box] || 0);
        if (opt.rt) {
          it.rt.push(Math.round(opt.rt));
          if (it.rt.length > cfg.keepRt) it.rt.shift();
        }
        if (!ok) {
          if (opt.answer) {
            var key = id + '>' + opt.answer;
            S.conf[key] = (S.conf[key] || 0) + 1;
          }
        } else {
          for (var k in S.conf) {
            if (k.indexOf(id + '>') === 0) { S.conf[k] -= 1; if (S.conf[k] <= 0) delete S.conf[k]; }
          }
        }
        if (round) {
          round.n++; if (ok) round.c++;
          if (opt.rt) round.rt.push(opt.rt);
        }
        if (cfg.milestones.indexOf(S.total) > -1) emit('milestone', S.total);
        save();
        return it;
      },

      /* 累積練習時間（遊戲自己決定什麼算「在練」） */
      addTime: function (ms) {
        if (!(ms > 0)) return;
        var d = today(), before = d.ms;
        d.ms += Math.round(ms);
        if (before < cfg.dailyGoalMs) {
          if (d.ms >= cfg.dailyGoalMs) { S.goalDays[dayKey()] = 1; emit('goal', api.streak()); }
        }
        save();
      },

      /* ---------- 一局 ---------- */
      roundBegin: function () { round = { n: 0, c: 0, rt: [] }; },
      roundActive: function () { return !!round; },
      roundEnd: function (opt) {
        opt = opt || {};
        if (!round) return null;
        var r = round; round = null;
        var acc = r.n ? r.c / r.n : 0;
        var res = { n: r.n, c: r.c, acc: acc, rtMed: median(r.rt), unlocked: [], passed: false, need: Math.ceil(cfg.gate.min * cfg.gate.threshold) };
        if (opt.gate !== false) {
          if (r.n >= cfg.gate.min) {
            if (acc >= cfg.gate.threshold) {
              res.passed = true;
              if (S.unlocked < cfg.order.length) {
                S.unlocked++;
                res.unlocked.push(cfg.order[S.unlocked - 1]);
                emit('unlock', { id: cfg.order[S.unlocked - 1], count: S.unlocked });
              }
            }
          }
        }
        save();
        return res;
      },

      /* ---------- 紀錄 ---------- */
      totals: function () { return { n: S.total, c: S.correct }; },
      today: function () { return assign({}, today()); },
      days: function (n) {
        var out = [], d = new Date();
        d.setHours(12, 0, 0, 0);
        for (var i = n - 1; i >= 0; i--) {
          var x = new Date(d.getTime() - i * 86400000), k = dayKey(x);
          out.push(assign({ d: k }, S.days[k] || { n: 0, c: 0, ms: 0 }));
        }
        return out;
      },
      streak: function () {
        var d = new Date(), n = 0;
        d.setHours(12, 0, 0, 0);
        if (!S.days[dayKey(d)]) d = new Date(d.getTime() - 86400000);
        while (S.days[dayKey(d)]) {
          if (!S.days[dayKey(d)].n) break;
          n++; d = new Date(d.getTime() - 86400000);
        }
        return n;
      },
      confusions: function (limit) {
        var out = [];
        for (var k in S.conf) {
          var p = k.split('>');
          out.push({ a: p[0], b: p[1], n: S.conf[k] });
        }
        out.sort(function (x, y) { return y.n - x.n; });
        return out.slice(0, limit || 5);
      },
      rtMedian: function (id) { return median(item(id).rt); },

      /* ---------- 設定 ---------- */
      get: function (k, dflt) { return Object.prototype.hasOwnProperty.call(S.settings, k) ? S.settings[k] : dflt; },
      set: function (k, v) { S.settings[k] = v; save(); },

      /* ---------- 其他 ---------- */
      hasProgress: function () { return S.total > 0 || Object.keys(S.stageDone).length > 0; },
      on: function (name, fn) { (listeners[name] = listeners[name] || []).push(fn); return api; },
      save: save,
      reset: function () {
        var keep = S.settings;
        S = fresh(cfg); S.settings = keep; round = null; lastPicked = null;
        save(); emit('reset', null);
      }
    };
    return api;
  }

  root.HyTrainer = { create: create, version: '1.0' };
})(window);
