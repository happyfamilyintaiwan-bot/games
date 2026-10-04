# games.knittinghiyori.com：給 Claude Code 的規則

- 這個 repo：遊戲站（GitHub Pages，純 HTML），**負責人 Zoe**；規範看 `games.md`。
- 一款遊戲一個資料夾；多語遊戲的英日版放在遊戲資料夾裡（`/<slug>/en/`、`/<slug>/ja/`）。
- 工具型內容放 tools，不放 games（例：季節訂房倒數由 Alison 在 tools 製作）。

## 先問是誰

工作階段開始時，使用者會說自己是 **Zoe** 或 **Alison**。沒說就先問，再依下面的分工做事。

兩人**共用同一個 GitHub 帳號**（happyfamilyintaiwan-bot），GitHub 分不出是誰，所以靠這兩點區分：Alison 的工作一律在 `alison/<主題>` 分支，合併時訊息開頭寫「Alison:」。

- **Alison**：一律在 `alison/<主題>` 分支工作，**不直接推 main**。收工時推上分支並開 PR（目標 main），PR 說明要有 DELIVERY 內容：
  1. 改了什麼、為什麼
  2. 檔案清單（新增／修改／刪除）
  3. 驗收方式：Zoe 合併前要跑的 build 與驗收，以及已經跑過的結果
  4. 規範更新包（見「收工」）；改到共管部分時，PR 最上面標「需 Zoe 確認」
  5. 合併後她還要自己做的事（例如 WordPress 301、GSC）

  沒有推分支的權限時，把改過的檔案和上面這份說明整理成可下載的資料夾或 zip，讓她傳給 Zoe。
- **Zoe**：負責 GitHub 存檔與管理，只有 Zoe 合併進 main。Zoe 只負責存檔，不改 Alison 範圍的內容；有問題就在 PR 留言退回。

## 分工

| 範圍 | 負責人 |
|---|---|
| games、poem | Zoe |
| story：追劇（drama）、漫畫（comics），含 the-early-spring、confession、when-i-meet-the-moon、hidden-love、the-first-frost | Zoe |
| tools（含還沒搬家的 WordPress 工具） | Alison |
| story：小說（novel） | Alison |
| 部落格文章 | 兩人 |
| 共管：`core.md`、`registry.md` 既有列、story 首頁 hub 外框、`story.md` 共用段落 | 兩人確認 |
| GitHub 存檔與管理（合併進 main、knittinghiyori-specs 更新） | Zoe |

完整分工表以 knittinghiyori-specs 的 `core.md` §0 為準。

## 不越界

發現這次工作會動到對方的範圍，或動到共管部分，**先停下來提醒，等使用者確認再繼續**。原則上只有「自己做完、請對方 check」時才跨範圍。

## 放錯位置

內容依類型歸負責人，不依放在哪個 repo。發現放錯子網域或 repo 的內容（例：season_booking 是工具卻放在 games），提出來並建議轉移步驟，**不要原地擴充**。

## 開工

1. 讀規範（唯一來源：`happyfamilyintaiwan-bot/knittinghiyori-specs`）：
   - Zoe 的桌機：在 `~/Sites/knittinghiyori/knittinghiyori-specs` 執行 `git pull` 後讀檔。
   - Alison 的網頁版：讀 `https://raw.githubusercontent.com/happyfamilyintaiwan-bot/knittinghiyori-specs/main/<檔名>`。
   - 每次都讀 `core.md`、`registry.md`、`CHANGELOG.md`，再加這次相關的站別檔（`games.md`／`poem.md`／`story.md`／`tools.md`／`blog.md`）。
2. **第一句回報**各檔版本號，以及 CHANGELOG 最新一筆的日期與版本。檔案版本比 CHANGELOG 最新一筆舊，可能是快取，提醒 5 分鐘後再讀。
3. 讀不到就說讀不到並停下，**不可以用記憶或舊副本代替**。
4. 開始改 repo 前先 `git pull`（Alison：從最新的 main 開 `alison/<主題>` 分支）。
5. 新工具、新遊戲、新作品：先確認 `registry.md` 的 id 和前綴沒有重複，登記後再開始寫程式。

## 收工

決定或修改了規則，或新增了 id、前綴、事件、參數，或狀態有變時，產生「規範更新包」：

- 檔案（舊版 → 新版）、位置、動作、可直接貼上的內容
- 一筆 CHANGELOG：`日期｜檔案 版本｜誰｜改了什麼｜為什麼`

Zoe 的 AI 直接套進 knittinghiyori-specs；Alison 的 AI 寫在 PR 說明裡。改到共管部分時，要對方確認後才 push。

版本號：影響追蹤數據或上線頁面 → 升中版號（v1.0 → v1.1）；文字修正、補充說明 → 升小版號（v1.0 → v1.0.1）。

## spec-version

每個頁面的 `<head>` 都要放：

```html
<meta name="spec-version" content="core-v1.1/<站別>-v<版本>">
```

換成上線當下的實際版本，例：`core-v1.1/games-v1.1`。

## 本檔由誰維護

這份 CLAUDE.md 由 Zoe 維護。Alison 覺得要改時，寫在 PR 說明裡請 Zoe 改。
