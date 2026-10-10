# 守燈人摩斯日誌（morse-code）

- 網址：games.knittinghiyori.com/morse-code/（目前只有中文）
- game_id：`morse_code`｜前綴：`morse_`｜page_title：`遊戲|守燈人摩斯日誌|摩斯密碼聽力訓練`
- 規範：core-v1.1／games-v1.2（Zoe 依序貼上 10/04 絕對音感包、10/09 摩斯包之後）
- 製作：Alison，2026-10-07

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 頁面（靜態文字、CSS、hyGame 追蹤碼、聯盟連結設定 `MORSE_LINKS`） |
| `game.js` | 畫面與流程 |
| `morse.js` | 內容包：字元表、LCWO Koch 順序（41 字元）、Web Audio 發聲、Farnsworth 計算 |
| `lang-zh.js` | 介面文字與老守燈人日誌；英日版加 `lang-en.js`／`lang-ja.js` |
| `og.png` | 分享圖 1200×630 |
| `/lib/hy-trainer/hy-trainer.js` | 共用引擎（放在 repo 根目錄 `/lib/`，不在本資料夾） |

## 玩法與一局定義

- 第一階段「日誌第一頁」（看）：固定 3 步，約 5 分鐘。點與劃 → 看著聽 E、T、A、N（4 題）→ 只用耳朵（6 題）。不計分。
- 第二階段「值班」（聽）：
  - 單字模式：一局＝一班 25 個字。
  - 連發模式（點亮 5 盞後開放）：一局＝9 組、每組 3 字，共 27 字。
  - 一局正確率 ≥ 90% → 點亮下一盞燈（解鎖下一個字元）。
- `correct_count`＝答對字數（連發按字計），`score`＝這一局正確率（%）。

## 追蹤事件

| 事件 | 參數 |
|---|---|
| `tutorial_begin`／`tutorial_complete` | 第一頁開始／完成 |
| `round_start`／`round_end` | `option`：koch／group；`level`：l01（K、M）～l40；`result`、`item_count`、`correct_count`、`score` |
| `game_unlock` | `unlock_id`：`koch_l02`…`koch_l40`、`all_lamps` |
| `game_milestone` | `milestone`：累積 1／10／50／100／500／1000／5000／10000 字 |
| `game_settings` | `setting`：`wpm_20`、`eff_12`、`tone_600`、`vol_60`、`flash_on`／`flash_off`、`mode_koch`／`mode_group` |
| `morse_skip_intro` | 按「我會摩斯碼了，直接值班」 |
| `morse_daily_goal` | 當日值班滿 10 分鐘，`streak` |
| `morse_pair_play` | 在「常聽錯的字」按對比聽 |
| `morse_progress_reset` | 清除紀錄 |
| `share`、`cta_click` | 照 core；cta_id：`brand_hub`、`about_hub`、`lighthouse_trip`（klook）、`source_*` |

## 存檔

- localStorage key：`hy_morse_v1`（引擎格式 v1）。改版要能讀舊存檔。
- 練習時間：兩次作答間隔最多算 20 秒，避免掛機灌時間。

## 聯盟連結

`index.html` 底部的 `window.MORSE_LINKS = { eluanbi: '', fuguijiao: '' }`：填入 Klook 聯盟連結（網址不可含和號）。空字串時按鈕和揭露文字都不顯示。

## 測試

`?hy_debug=1` 看 Console 的 `[hy-game]`；加 `hy_unlock=9`（用和號接在後面）可直接跳到第 9 盞燈。
