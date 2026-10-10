# hy-trainer v1.0：實證訓練法系列共用引擎

放在 games repo 的 `/lib/hy-trainer/`。第一個使用者：`morse-code`（守燈人摩斯日誌）。之後的 HVPT 聲調、記憶宮殿、畫風辨識、認雲等遊戲共用這一份。

## 負責什麼

| 功能 | 做法 |
|---|---|
| 階段 | `stages: ['look','listen']`；`completeStage(name)` 進下一階段 |
| 門檻解鎖（Koch 式） | 一局至少 `gate.min` 題、正確率 ≥ `gate.threshold` → 解鎖 `order` 的下一個 |
| 交錯練習 | `pick()` 從所有已解鎖項目加權抽題，不連續出同一題 |
| 間隔複習 | 每個項目有複習盒 0–4：答對升一盒、答錯回 0；盒子越低、逾期越久、越常被混淆，權重越高 |
| 進度紀錄 | 每日題數、正確數、練習毫秒數；連續天數；混淆配對；設定值 |

不負責：題目內容、聲音、畫面、追蹤碼。這些放在各遊戲資料夾。

## 用法

```js
var tr = HyTrainer.create({
  key: 'hy_morse_v1',          /* localStorage key，每款遊戲不同 */
  order: ['K','M','U', ...],   /* 解鎖順序 */
  start: 2,                    /* 一開始解鎖幾個 */
  stages: ['look','listen'],
  gate: { min: 25, threshold: 0.9 }
});
tr.roundBegin();
var id = tr.pick();
tr.record(id, ok, { rt: 820, answer: '玩家選的' });
tr.addTime(ms);                /* 遊戲決定什麼算「在練」 */
var res = tr.roundEnd();       /* { n, c, acc, rtMed, unlocked:[...], passed } */
tr.on('unlock', fn); tr.on('milestone', fn); tr.on('goal', fn);
```

其他：`unlocked()`、`unlockedCount()`、`newest()`、`item(id)`、`days(14)`、`streak()`、`confusions(4)`、`get/set`（設定）、`reset()`（保留設定）。

## 規則

- 整份檔案不含「和號」字元（core §3-1 #7）。
- 改引擎前先確認所有使用中的遊戲都相容；存檔格式變動要能讀舊存檔。
