# 編織日和小遊戲站 SOP

網址：https://games.knittinghiyori.com/
主機：GitHub Pages（repository：`games`）

## 資料夾結構

```
games/
├─ index.html              ← 遊戲總覽首頁（每加一款遊戲就加一張卡片）
├─ hiyori-flower-shop/
│   └─ index.html          ← 遊戲一：ひより花店
├─ （下一款遊戲資料夾）/
│   └─ index.html
├─ _template/index.html    ← 新遊戲的空白模板（底線開頭的資料夾不會被發布到網站上）
├─ assets/                 ← 共用圖片：分享封面 og-遊戲名.jpg、縮圖
├─ 404.html                ← 找不到頁面時顯示
├─ sitemap.xml             ← 每加一款遊戲就加一行
├─ robots.txt
└─ CNAME                   ← 自訂網域，不要刪
```

## 命名規則

- 資料夾名稱 = 網址，**上線後不要再改**（改了舊的分享連結會失效）
- 只用小寫英文、數字、連字號，例如 `hiyori-flower-shop`、`english-typing-cafe`
- 每個遊戲資料夾裡的主檔一律叫 `index.html`
- 每款遊戲都是獨立的單一檔案，不共用程式，改一款不會影響另一款

## 新增一款遊戲（檢查清單）

1. [ ] 把 `_template` 複製成新資料夾，改成遊戲的網址名稱（slug）
2. [ ] 打開新資料夾的 `index.html`，照 ★1–★8 填好：標題、描述、SLUG、封面圖、遊戲本體、文章連結、GA4 的 game_id 與遊戲容器 id
   - 遊戲內在「一局開始／結束／分享」呼叫 `hyGame.roundStart`／`roundEnd`／`share`（參考 hiyori-flower-shop）
   - 在首頁卡片的 `data-game` 填同一個 game_id，並登記到 GA4 遊戲登記表
3. [ ] 封面圖（1200×630）放進 `assets/`，檔名 `og-SLUG.jpg`
4. [ ] 首頁 `index.html`：複製一張遊戲卡片，改連結、名稱、說明、標籤
5. [ ] 首頁 `index.html` 最上方的結構化資料（ItemList）加一筆
6. [ ] `sitemap.xml` 加一行網址
7. [ ] 上傳並 Commit，1–2 分鐘後開網址確認
8. [ ] 用 LINE 傳給自己，確認分享預覽圖正常
9. [ ] 網址加 `?hy_debug=1` 開啟，在瀏覽器主控台確認 game_start、round_start、round_end、share 事件都有送出
10. [ ] 部落格寫一篇介紹文章，用 iframe 嵌入遊戲；網址後面加 `?share=文章網址`

## 更新既有遊戲

- 在 GitHub 點進該遊戲的 `index.html` → 右上角鉛筆圖示編輯，或上傳同名檔案覆蓋
- 同時更新 `sitemap.xml` 裡該遊戲的 `lastmod` 日期
