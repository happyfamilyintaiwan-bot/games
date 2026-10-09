# 固定作息燈塔（sleep-rhythm）

- 網址：games.knittinghiyori.com/sleep-rhythm/（目前只有中文）
- game_id：`sleep_rhythm`｜前綴：`sleep_`｜page_title：`遊戲|固定作息燈塔|固定睡眠時間養成`
- 規範：core-v1.3／games-v1.6（spec-version meta 同）
- 製作：Alison，2026-10-09

## 檔案

| 檔案 | 內容 |
|---|---|
| `index.html` | 全部（靜態文字、CSS、遊戲程式、追蹤、聯盟設定 `SLEEP_LINKS`） |
| `og.png` | 分享圖 1200×630（左上品牌列、網址寫到 /sleep-rhythm） |
| `README.md` | 本檔 |

不使用 `/lib/hy-trainer/`（這款是每日打卡，不是訓練關卡）。

## 玩法

- 第一次進入：老守燈人的交接信 → 設定目標起床／就寢時間、城市與燈塔名。城市預設依裝置時區猜（台灣預設台北）。
- 每天兩次打卡：「起床・點燈」（目標前 3 小時到後 5 小時可按）、「就寢・熄燈」（目標前 4 小時到後 5 小時可按）。中午前按的就寢卡算前一晚。錯過可「補登時間」。打卡後 8 秒內可「復原」。
- 計分：和目標差 30 分鐘內滿分、差 2 小時以上 0 分，中間線性。一天＝當天到期的打卡平均；漏打算 0。從第一次打卡那天開始算。
- 同步率＝最近 7 天每天分數平均。
- 燈靈階段（依累積準時打卡次數）：火種 0、燭芽 5、燈苗 14、焰羽 30、守夜燈靈 60、燈塔之心 100。
- 連續天數：有準時打卡的天數連續；每 7 天可漏 1 天（燈靈替你守一晚）。
- 主視覺（`renderScene`，SVG 靜態插畫）：燈塔、守燈人小屋、碼頭與港口。
  - 燈：起床打卡後亮、就寢打卡後熄（`lampLit()`）。亮著時有光束與燈室裡的燈靈火焰。
  - 船：同步率每 20% 多一艘靠港（最多 5 艘），其餘停在海平線等待。
  - 港口逐漸熱鬧（依燈靈階段，即累積準時打卡 5／14／30／60／100 次）：木箱 → 碼頭路燈 → 彩旗 → 港邊小屋 → 燈籠串。頁面上的「港口小驚喜」列顯示已收集的項目，未收集的顯示「？」；升級時提示「港口多了「…」」。
  - 守燈人小屋放在岬角的平台上。
  - 天色：依城市日出日落分清晨／白天／黃昏／夜晚四種配色，太陽或月亮沿弧線移動，海面有倒影；白天有雲和海鳥，夜晚有星星。
- 燈環（在「航海日誌」分頁）：一圈一天、最外圈今天；圓圈＝起床、菱形＝就寢、琥珀色區＝準時區。
- 日出日落：依城市（台灣 20 縣市＋21 個海外城市，`CITIES`）用 NOAA 簡化公式算當天日出日落，換算成裝置當地時間。燈環外框＝白天（淡金）與黑夜（深藍），現在時間夜裡是光束、白天是太陽。極區沒有日出或日落時整圈同色。
- 成績卡上方放當下的港口畫面。
- 守燈人手記（「航海日誌」分頁底部，`DIARY`）：11 頁，達成條件就翻開一頁並自動跳出（故事＋一則作息小訣竅）。條件：第一次打卡、第一次準時、連續 3／7／14／30 天、第一次晨光任務、第一座朋友燈塔、準時 14／30／100 次。已翻開的存在 `diary`。
- 晨光任務：起床打卡後 3 小時內出現，按「曬到了」記在當天（`log.l`），燈靈旁出現閃光；**不計分**。

## 一局定義

一局＝一次打卡（含補登）。`round_start` 與 `round_end` 同時送出。

## 追蹤事件

**不送任何打卡時間、和目標的差距或準不準時。**

| 事件 | 參數 |
|---|---|
| `game_start` | `entry_point`：direct／shared／saved |
| `tutorial_begin`／`tutorial_complete` | 交接信開始／完成設定 |
| `sleep_skip_intro` | 交接信按「直接開始」 |
| `round_start`／`round_end` | `option`：wake／sleep；`level`：燈靈階段 l01–l06；`round_end` 加 `result=complete`、`item_count=1` |
| `sleep_backfill` | 補登，`option`：wake／sleep（同時也送 round_start／round_end） |
| `game_unlock` | `unlock_id`：`spirit_l02`…`spirit_l06`（帶 `level`）；手記 `diary_01`…`diary_11` |
| `sleep_diary_open` | 從手記列表翻開某一頁 |
| `game_milestone` | `milestone`：連續 3／7／14／30／60／100 天；`option=streak` |
| `game_settings` | `setting`：`target_wake`／`target_sleep`／`name`／`city`（不送城市值） |
| `sleep_morning_light` | 完成晨光任務 |
| `sleep_report_open` | 打開「航海日誌」分頁 |
| `sleep_fleet_open` | 打開「燈塔聯盟」分頁 |
| `sleep_friend_add` | 加入朋友燈塔；`result`：new／update；`source`：link（邀請連結）／paste（貼上） |
| `sleep_progress_reset` | 清除全部紀錄 |
| `share`／`share_cancel` | 遊戲分享列：`content_type` 有準時打卡前 `game`、之後 `result`；邀請朋友：`content_type=invite`；成績卡：`result` |
| `export` | 下載成績卡 `method=image`、`content_type=result` |
| `cta_click` | `brand_hub`、`about_hub`（game）、`lighthouse_trip`（klook）、`source_link`（other） |
| `game_exit` | 離開頁面 |

註：追蹤函式是頁面內建的 `track()`（try/catch、沒有 gtag 時排進 dataLayer、`?hy_debug=1` 印 `[hy-game]`），已設 `HY_GAME_ID`、`HY_GAME_ROOT`、`HY_GAME_LANG`。若上架時要改用標準 hyGame 追蹤碼，請刪掉頁面自己送的 `game_start`／`game_exit`，避免重複。

## 好友（燈塔聯盟）

- 邀請連結：`/sleep-rhythm/?ref=share#f=<代碼>`，代碼是燈塔卡片的 base64url JSON：燈塔 id、燈塔名（12 字內）、同步率、連續天數、燈靈階段、日期。**沒有任何時間紀錄。**
- 代碼放在 `#` 片段，`<head>` 在 GA4 載入前讀出並用 `history.replaceState` 從網址移除，所以 GA4 的 page_location 只會是 `?ref=share`，不會帶到讀者輸入的燈塔名。
- 沒有伺服器；朋友資料存在各自的 localStorage，最多 30 座。3 天沒更新的燈塔變暗。

## 存檔

- localStorage key：`hy_sleep_v1`。欄位：start、diary（已翻開的手記頁）、city（城市代碼）、wake、sleep（分鐘）、name、log（日期→{w,s,l}）、friends、ms（已送里程碑）、stage、tut、id。
- 就寢在凌晨時存成 24 點之後的分鐘數（例 00:30 → 1470）。

## 聯盟連結

`index.html` 底部的 `window.SLEEP_LINKS`（網址不可含和號；空字串時該卡片隱藏，兩個都空時整區隱藏）：

| key | 位置 | 連結 |
|---|---|---|
| `eluanbi` | 鵝鑾鼻燈塔卡片 | https://klook.tpk.ro/6eB8W3S8 |
| `fuguijiao` | 富貴角燈塔卡片 | https://klook.tpk.ro/AFEYvT5T |

## 測試

`?hy_debug=1` 看 Console 的 `[hy-game]`；Console 執行 `hySleepDemo(12)` 會灌入 12 天示範資料並重新整理（只在偵錯模式存在）。
