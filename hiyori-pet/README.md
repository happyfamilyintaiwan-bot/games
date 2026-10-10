# 日和毛孩（hiyori-pet）

網址：https://games.knittinghiyori.com/hiyori-pet/
game_id：`hiyori_pet`｜事件前綴：`pet_`｜只有中文
規範：core-v1.4／games-v1.8.1（`<meta name="spec-version">`）

網頁電子寵物：選曼基貓或邊境牧羊犬，從蛋開始照顧。純前端，沒有伺服器，資料只存在玩家的瀏覽器。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | 全部內容：像素圖引擎（`HP_PX`）、明信片圖（`HP_PC`）、信件與點心資料（`HP_DATA`）、遊戲本體 |
| `manifest.json` | 讓它能「加到主畫面」 |
| `sw.js` | 沒網路也打得開；每次先問伺服器有沒有新版。改這個檔時把 `CACHE` 的版本號加一 |

遊戲程式照 games 的慣例：不用「和號」字元，不用雙斜線註解。

## localStorage（改版要相容舊存檔）

| key | 內容 |
|---|---|
| `hiyori-pet:save` | 目前這隻毛孩（`v: 3`；升級寫在 `upgrade()`） |
| `hiyori-pet:book` | 收藏本：圖鑑、養過的毛孩、明信片、點心櫃、走動紀錄（`walk`）、來作客的毛孩（`visitor`）、是否問過電子報（`kitAsked`） |
| `hiyori-pet:ios-tip` | iPhone「加入主畫面」小卡看過了 |
| `hiyori-pet:save-debug`、`hiyori-pet:book-debug`、`hiyori-pet:debug-clock` | 測試模式專用，和正式存檔分開 |

搬家碼＝`save`＋`book` 打包（`HP1.<base64>.<檢查碼>`）。新增要跟著玩家走的資料，請放進 `book`。

## 一局＝玩一次接飛盤

`round_start {option: frisbee}` → `round_end {result: complete, score＝接到幾個, item_count: 6, correct_count＝接到幾個}`。

## GA4 事件

| 事件 | 何時 | 參數 |
|---|---|---|
| `game_start` | 第一次在遊戲區點擊 | `entry_point`：`shared`（網址有 `?ref=share`）／`saved`（已有存檔）／`direct` |
| `pet_adopt` | 領養 | `pet_type`：cat／dog |
| `pet_action` | 正餐、點心、清便便、洗澡、陪玩、找牠回來 | `action`、`option`：page／pip |
| `pet_stage` | 長到下一階段 | `stage` |
| `pet_mail_read` | 讀信 | `letter_id` |
| `pet_pip_open` | 開浮動小窗 | |
| `pet_pwa_install` | 加到主畫面完成 | |
| `pet_move` | 搬家碼 | `option`：export／import |
| `pet_walk_remind` | 走動提醒跳出 | `option`：notice／block |
| `pet_walk_done` | 散步回來 | `option`：manual／idle |
| `pet_walk_snooze` | 稍後提醒 | `option`：later／today |
| `pet_visit_share` | 傳出串門子連結 | `method`：native／copy_link（同時送 `share {content_type: invite}`） |
| `pet_visit_open` | 打開朋友的串門子連結 | `has_pet` |
| `share` | 分享列 | `method`：native／line／copy_link，`content_type: game` |
| `cta_click` | 見下表 | |

打開頁面當下送的事件會先排隊，等共用追蹤碼載入後再送（`trackQ`）。

## 連結（集中在 `window.PET_LINKS`，空字串就自動藏起來）

| key | 位置 | cta_id／cta_type |
|---|---|---|
| `klook_pet_hotel` | 明信片背面（旅行回來的獎勵畫面） | `trip_result`／`klook` |
| `portrait_simple`、`portrait_pencil` | 遊戲下方聯盟區（蝦皮似顏繪，編織日和自己的賣場） | `below_game`／`shopee` |
| `kit` | 少年期問一次（`newsletter_teen`）＋說明區一行小連結（`newsletter_below`） | `newsletter` |

聯盟最多 2 個位置（games 規範 §5）。廣告整頁 1 格，在回主頁大按鈕下方；浮動小窗、擋路模式、遊戲區內都不放。

## 測試

- `?hy_debug=1`：測試模式（測試存檔、跳時按鈕、主控台印出事件）
- `?hy_debug=1&speed=1440`：1 分鐘＝1 天
- `?hy_debug=1&walkany=1`：走動提醒不看上班時段；`&ios=1`：假裝是 iPhone
- 回歸測試：my-agent `100_Todo/projects/hiyori-pet/regression-test.js`（貼進主控台，全部 PASS 才算過；網址不要帶 `walkany=1`）

## 數值在哪裡改

`index.html` 遊戲本體最上面：`RATE`（下降速度）、`CARE`（各動作效果）、`PLAY`（接飛盤）、`TRIP_*`（旅行）、`WALK`（走動提醒）。改完同步改回歸測試的預期值。
