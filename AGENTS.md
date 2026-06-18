# AGENTS.md

## 用途

此儲存庫是一個部署在 GitHub Pages 上的靜態個人部落格。

目前網站的組成方式如下：

1. `index.html` 作為首頁 / 入口頁
2. 每個主題分類各自有一個文章列表頁
3. 所有單篇文章共用一個文章殼頁 `article.html`
4. 文章原始內容檔放在 `articles/<category-slug>/` 之下

這個專案目前沒有使用前端框架、沒有打包工具，也沒有建置流程。所有頁面都是瀏覽器直接載入的 HTML、CSS、JavaScript。

這份文件是提供給未來的代理、協作者或維護者使用，目的是讓後續擴充時不要破壞目前的文章系統。

## 目前網站架構

### 入口頁面

- `index.html`
  - 主首頁
  - 內容包含網站介紹、個人資訊、最新資訊、分類入口卡片
  - 負責導向各分類文章列表頁

- 各分類文章列表頁
  - `music.html`
  - `programming.html`
  - `drawing.html`
  - `3dmax.html`
  - `unity.html`
  - `game.html`
  - `dream-bureau.html`
  - 這些頁面本身只是薄殼 HTML，透過 `data-page="category"` 與 `data-category="<slug>"` 指定分類
  - 頁面本身不硬寫文章列表，文章卡片由 JavaScript 動態產生

- `article.html`
  - 所有單篇文章共用的殼頁
  - 依照 query string 判斷要載入哪一篇文章
  - 範例格式：
    - `article.html?category=music&slug=test-post`

### 共用前端檔案

- `js/site-data.js`
  - 網站核心設定檔
  - 定義分類資料
  - 建立站內相對路徑
  - 管理分類 slug 與頁面檔名的對應
  - 是分類路由的主要真實來源

- `js/site-blog.js`
  - 負責渲染分類文章列表頁
  - 負責渲染單篇文章頁
  - 負責載入文章原始檔
  - 處理本機預覽時的 manifest fallback 與 GitHub Pages 上的 GitHub API fallback

- `js/site-home.js`
  - 首頁互動行為
  - 包含首頁區塊導覽與訪客資訊顯示

- `css/site-home.css`
  - 首頁專用樣式

- `css/site-blog.css`
  - 分類文章列表頁與單篇文章頁專用樣式

- `tools/article-generator/`
  - 文章 HTML 產生器工具
  - 提供表單 UI 建立文章草稿或直接發佈
  - 可自動補齊必要欄位
  - 可直接更新 `articles/manifest.json`

## 分類對應表

目前分類的 slug 與頁面檔名不是完全一對一，不能直接假設名稱相同。

| 分類 Slug | 對外頁面 | 文章資料夾 |
| --- | --- | --- |
| `music` | `music.html` | `articles/music/` |
| `programming` | `programming.html` | `articles/programming/` |
| `drawing` | `drawing.html` | `articles/drawing/` |
| `max` | `3dmax.html` | `articles/max/` |
| `unity` | `unity.html` | `articles/unity/` |
| `game-dev` | `game.html` | `articles/game-dev/` |
| `dream-bureau` | `dream-bureau.html` | `articles/dream-bureau/` |

重要：

- 不要假設頁面檔名一定等於分類 slug
- `max` 對應 `3dmax.html`
- `game-dev` 對應 `game.html`

如果要新增分類，請同步更新以下內容：

1. `js/site-data.js`
2. 新增一個新的分類頁 HTML 檔
3. 新增 `articles/<slug>/` 資料夾
4. 更新 `articles/manifest.json`
5. 更新 `index.html` 中的首頁分類連結

## 文章系統

### 文章放置位置

每篇文章都是獨立 HTML 檔，存放於：

- `articles/music/`
- `articles/programming/`
- `articles/drawing/`
- `articles/max/`
- `articles/unity/`
- `articles/game-dev/`
- `articles/dream-bureau/`
- `articles/draft/`

補充說明：

- `articles/draft/` 是草稿區，不屬於正式分類頁文章來源
- 正式文章仍然必須放在 `articles/<category-slug>/`
- 目前分類資料夾不保證還有模板文章，某些分類可能是空的

### 文章產生器

目前專案已提供一個可直接使用的文章產生器：

- `tools/article-generator/index.html`
- `tools/article-generator/article-generator.js`
- `tools/article-generator/article-generator.css`
- `tools/article-generator/start-article-generator.ps1`

用途：

- 透過表單建立符合目前文章系統的 HTML
- 自動補齊必要欄位，例如標題、摘要、日期、eyebrow、slug 與基本內文
- 可勾選是否置頂，對應 `<meta name="article:pinned" content="true" />`
- 支援兩種儲存模式：
  - 草稿模式：輸出到 `articles/draft/`
  - 直接發佈模式：輸出到 `articles/<category-slug>/`，並自動更新 `articles/manifest.json`

使用方式：

```powershell
powershell -ExecutionPolicy Bypass -File tools/article-generator/start-article-generator.ps1
```

重要：

- 第一次存檔時，應選擇 repo 內的 `articles/` 根資料夾，而不是只選 `draft/`
- 如果使用草稿模式，文章不會出現在分類頁
- 如果使用直接發佈模式，產生器會幫你把文章寫進對應分類，並自動更新 manifest
- 如果你是手動搬移草稿或手動新增檔案，仍然要自己更新 manifest

### 建議文章結構

每篇文章檔案應維持接近以下結構：

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="utf-8" />
    <title>文章標題</title>
    <meta name="description" content="文章摘要，會顯示在文章列表與文章頁開頭。" />
    <meta name="article:category" content="music" />
    <meta name="article:published" content="2026-05-25" />
    <meta name="article:updated" content="2026-05-25" />
    <meta name="article:pinned" content="true" />
</head>
<body>
    <article class="article-template">
        <header class="article-header">
            <p class="post-eyebrow">Music</p>
            <h1>文章標題</h1>
            <p class="post-summary">文章摘要。</p>
        </header>
        ...
    </article>
</body>
</html>
```

### 渲染器會讀取哪些欄位

`js/site-blog.js` 目前會讀取：

- `<title>` -> 文章標題
- `<meta name="description">` -> 文章摘要
- `<meta name="article:published">` -> 顯示日期與排序依據
- `<meta name="article:updated">` -> 更新日期
- `<meta name="article:pinned">` -> 若為 `true`，分類頁會把文章排到前面
- `.post-eyebrow` -> 文章卡片標籤與文章頁眉眼標
- `.article-template` -> 文章主要內容

如果缺少這些欄位，系統雖然有部分 fallback，但新文章應盡量補齊完整資料。

補充：

- `article:pinned` 是可選欄位
- 如果有多篇置頂文章，置頂群組內仍然會依日期新到舊排序
- 非置頂文章會排在置頂文章之後，一樣依日期新到舊排序

### 文章網址運作方式

分類頁的文章卡片會連到共用的文章頁：

- `article.html?category=<slug>&slug=<不含副檔名的檔名>`

範例：

- 檔案：`articles/music/test-post.html`
- 文章網址：`article.html?category=music&slug=test-post`

除非使用者明確要求改架構，否則不要把每篇文章做成獨立對外頁面。

## 分類列表如何載入

分類頁並沒有把文章卡片直接寫死在 HTML 內。

目前分類頁文章列表由 `js/site-blog.js` 動態建立。

### 本機預覽行為

當網站不是跑在 `*.github.io` 網域上時，分類頁會優先從：

- `articles/manifest.json`

讀取該分類有哪些文章檔。

這是本機預覽時的主要資料來源。

補充：

- `articles/draft/` 不會被視為正式分類
- 直接發佈模式會同步更新 `articles/manifest.json`
- 草稿模式不會更新正式分類頁列表

### GitHub Pages 上的行為

當網站部署在 GitHub Pages 上時，分類頁會依序嘗試：

1. GitHub Repository Contents API
2. fallback 到 `articles/manifest.json`

這樣可以同時兼顧部署後與本機預覽兩種環境。

## Manifest 維護規則

### Manifest 檔案

- `articles/manifest.json`

這個檔案列出每個分類底下有哪些文章檔案。

### 更新腳本

- `tools/update-article-manifest.ps1`

當你新增、刪除或重新命名文章檔時，應重新執行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/update-article-manifest.ps1
```

這支腳本會掃描 `articles/` 底下所有分類資料夾，然後重寫 `articles/manifest.json`。

### 重要規則

如果你新增文章後沒有更新 manifest，本機預覽的分類文章列表可能不會顯示新文章。

補充：

- `articles/draft/` 會被排除，不會寫進 manifest
- 使用文章產生器的「直接發佈模式」時，manifest 會自動更新
- 使用文章產生器的「草稿模式」時，manifest 不會更新
- 手動新增、刪除、重新命名文章檔時，仍然應重新執行腳本

## 本機預覽注意事項

不要依賴直接用 `file://` 開啟頁面。

因為網站目前使用 `fetch()` 讀取：

- `articles/manifest.json`
- 單篇文章 HTML 內容檔

多數瀏覽器在 `file://` 環境下會阻擋這些請求。

請使用本機 HTTP 伺服器預覽。

任何簡單的靜態伺服器都可以，例如：

```powershell
python -m http.server 8000
```

也可以使用 IDE 內建的靜態預覽工具。

## 首頁說明

`index.html` 目前是內容型入口首頁。

現在首頁包含：

- 首頁 Hero 區
- 個人資訊區
- 最新資訊區
- 分類入口卡片
- 專案聚焦區
- 舊頁面整理區

未來調整時，請保留目前這種內容分工：

- 首頁 = 導覽與摘要
- 分類頁 = 文章列表
- 文章頁 = 單篇完整內文

除非使用者明確要求，否則不要改回舊式單頁 partial loader 架構。

### 首頁與分類頁的實際維護重點

- `index.html` 是目前唯一有完整內容編排與固定文案的頁面，包含 Hero、個人資訊、最新資訊、分類入口、專案聚焦與舊頁面整理
- 各分類頁 HTML 目前都是薄殼頁，只負責提供 `data-page="category"` 與 `data-category="<slug>"`，文章卡片內容不是寫死在這些 HTML 裡
- `article.html` 也是薄殼頁，本身不承載固定內文，真正內容來自 `articles/<category-slug>/` 下的文章檔
- 如果使用者只是要修改首頁文案，通常應優先改 `index.html`，不要誤改分類頁 HTML
- 如果使用者只是要調整文章列表顯示方式，通常應改 `js/site-blog.js`，不要在各分類頁手動補卡片

### 夢境管理局分類補充

- `dream-bureau.html` 現在已開始承載正式公開文章，不再只是預留空分類
- 目前已建立的文章方向以公開版世界觀、組織介紹、法則與機制整理為主
- 如果後續繼續新增《夢境管理局》文章，除非使用者明確要求，否則優先寫「可公開設定」
- 盡量不要在公開文章中直接寫出主線真相、角色底牌、後期劇情轉折、Script 設計、關卡內幕或會明顯劇透的內容
- 可優先公開的內容通常包括：世界觀總覽、組織架構、能量規則、夢境機制、非劇透版角色定位、開發筆記

## 舊版 / 實驗頁面

以下舊檔案仍存在，並且仍從首頁或側邊導覽可進入：

- `announcement.html`
- `Regex.html`
- `SideProject.html`
- `Cube.html`
- `Collapse.html`
- `ToolList.html`

這些頁面不屬於目前的新文章系統。

除非使用者明確要求整理或重構，否則請視為舊版 / 實驗性內容。

### 舊頁面現況補充

- `announcement.html` 目前是空檔案，若未被使用者明確指定，先不要拿它當新首頁或公告系統的基礎
- `Regex.html` 是獨立的小工具頁，仍有實際內容，但屬於舊式單頁工具，不應作為新版首頁或文章頁的樣式參考
- `SideProject.html`、`ToolList.html`、`Empty.html` 目前幾乎是空白或樣板狀態
- `Cube.html` 是獨立的 three.js 展示頁，依賴 `main.js`、`WindowManager.js`、`three.r124.min.js`
- `Collapse.html` 是舊版 Bootstrap / jQuery 測試頁
- 這些頁面大多屬於歷史殘留或實驗稿，後續若不是使用者直接要求，不要主動把它們納入新文章系統，也不要拿它們的寫法回頭污染新頁面

## 文案與寫作風格

### 全站文案偏好

- 文案請偏自然、直接、具體，像個人開發筆記、專案整理或設定筆記，不要寫成制式行銷頁
- 避免過度空泛、過度包裝、沒有資訊量的形容詞堆疊
- 避免太像 AI 寫作的對比句型，尤其是「這不是……，而是……」這類模板式寫法
- 也避免連續使用過多「不只是……也……」「不是單純……而是……」「更深一層來看……」這類過度修辭的句式
- 如果可以直接說清楚，就直接說清楚，不要為了氣勢硬拉抽象層次

### 首頁文案偏好

- 首頁文案應以「站點介紹、分類導覽、目前更新重點」為主，不要寫得像品牌廣告或募資頁
- 語氣可以正式，但仍應保留個人站的溫度與真實感
- 首頁每個區塊的文字應該好懂、可掃讀，不要塞太多世界觀術語或過長抒情段落

### 世界觀文章文案偏好

- 《夢境管理局》相關文章優先使用「設定整理 / 世界觀筆記 / 開發中的公開說明」這種語氣
- 先把規則、概念、系統講清楚，再決定要不要補情緒氛圍
- 不要為了營造神祕感而寫得太霧；如果是公開版設定，重點是讓人看懂
- 涉及劇情時，預設採取防劇透寫法，除非使用者明確要求公開更多內容

## 樣式維護原則

目前站點有兩套主要樣式系統：

1. 首頁樣式：`css/site-home.css`
2. 部落格 / 文章頁樣式：`css/site-blog.css`

修改時請遵守：

- 首頁相關調整放在 `site-home.css`
- 分類頁 / 文章頁相關調整放在 `site-blog.css`
- 不要重新把 Bootstrap 相依性拉回新架構裡
- 優先延伸目前自訂樣式，而不是混用舊系統與新系統

## 安全修改模式

### 新增文章

建議優先使用文章產生器。

做法 A：使用文章產生器直接發佈

1. 執行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/article-generator/start-article-generator.ps1
```

2. 在 UI 中填寫分類、標題、摘要、日期與內文
3. 將儲存模式切到「直接發佈到目前分類並更新 manifest」
4. 第一次存檔時選擇 repo 內的 `articles/` 根資料夾
5. 儲存完成後，確認分類頁有出現新文章
6. 確認 `article.html?category=...&slug=...` 可以正確打開

做法 B：先存草稿再手動整理

1. 用文章產生器將文章存到 `articles/draft/`
2. 確認內容後，把檔案移到 `articles/<category-slug>/`
3. 執行：

```powershell
powershell -ExecutionPolicy Bypass -File tools/update-article-manifest.ps1
```

4. 確認分類頁有出現新文章
5. 確認 `article.html?category=...&slug=...` 可以正確打開

做法 C：完全手動建立

1. 新增一個符合文章格式的 HTML 檔到 `articles/<category-slug>/`
2. 補齊標題、摘要、日期、eyebrow 與內文
3. 執行 manifest 更新腳本
4. 驗證分類頁與文章頁是否正常

### 新增分類

1. 在 `js/site-data.js` 中新增分類 metadata
2. 建立 `articles/<slug>/`
3. 如需保留空分類，請至少放一個 `.gitkeep` 之類的佔位檔，避免資料夾在 Git 中消失
4. 建立新的分類頁 HTML 殼
5. 更新 `index.html` 中的分類連結、卡片或下拉選單
6. 如果要馬上有文章，可用文章產生器直接發佈第一篇文章
7. 更新 manifest
8. 驗證分類頁與文章頁是否正常

### 修改文章渲染方式

如果要調整文章如何顯示，請修改 `js/site-blog.js`。

調整時要特別小心不要破壞：

- 文章摘要擷取
- 依日期排序
- query string 路由
- 本機 manifest 載入邏輯
- GitHub API fallback 邏輯

## 已知限制與容易踩雷的地方

### 1. 本機與正式站資料來源不同

本機預覽主要依賴 `articles/manifest.json`。
正式站可能優先走 GitHub API。

如果部署後正常、本機不正常，先檢查 manifest。
如果本機正常、部署後不正常，先確認新檔案是否已 commit/push。

### 2. 所有文章共用同一個文章殼

所有文章都透過 `article.html` 顯示。

如果你修改文章殼版面，所有文章頁都會一起受到影響。

### 3. Query String 路由不可缺

文章頁必須同時帶有：

- `category`
- `slug`

少掉其中任何一個，都會進入錯誤狀態頁。

### 4. 日期格式會影響排序

文章目前採兩層排序：

- 先看 `<meta name="article:pinned">`，置頂文章會排在前面
- 同一群組內再依 `article:published` 或 `article:updated` 排新到舊

請使用標準 ISO 風格日期，例如：

- `2026-05-25`

### 5. 特殊分類對應別搞錯

這兩個是目前最容易誤判的對應：

- `max` -> `3dmax.html`
- `game-dev` -> `game.html`

### 6. 草稿不會自動上線

`articles/draft/` 只是草稿區。

- 放在 `draft` 底下的文章不會出現在任何正式分類頁
- 只有移到 `articles/<category-slug>/`，或用產生器的直接發佈模式寫進分類資料夾，才會成為正式文章
- 如果不是透過直接發佈模式，記得同步更新 manifest

## 建議驗證清單

每次內容或結構調整後，請至少確認：

1. `index.html` 仍然導向正確的分類頁
2. 每個分類頁都能正常打開，不進錯誤頁
3. 每個分類頁顯示的文章數量符合預期
4. 文章卡片打開時 query string 正確
5. 單篇文章頁能正確顯示標題、摘要、日期與內文
6. `articles/manifest.json` 已包含本機新增的文章檔
7. 如果文章只是草稿，確認它仍然留在 `articles/draft/`，且沒有誤進正式分類
8. 如果文章是直接發佈，確認 `articles/<category-slug>/` 與 manifest 都已同步更新

## 留言系統說明

目前網站已整合 `giscus`，掛載位置在單篇文章頁底部。

目前留言系統特性：

- 整合點在 `js/site-blog.js`
- 留言要綁定單篇文章，不要掛在分類頁
- 目前使用 `url` 當 discussion mapping
- GitHub Discussions 分類會依站內分類動態切換
- `unity` 目前 fallback 到 `Announcements`

調整時請特別注意：

- 不要改回 `pathname` 對應，因為本站所有文章共用 `article.html`
- 不要任意改變既有文章的 `category` 或 `slug`，否則可能對不到原本的留言串
- 如果要新增新的 Discussions 分類對應，請同步更新 `js/site-blog.js`

## 通常不建議碰的檔案 / 目錄

除非真的有明確需求，否則不要主動修改：

- `.vs/`
- `packages/`
- 舊版 Bootstrap 相關目錄，例如 `Content/`、舊 `css/`、`Scripts/`
- `main.js`
- `WindowManager.js`
- `three.r124.min.js`

這些大多是舊內容、實驗內容，或與目前新的部落格架構無直接關聯。

## 總結

這個專案目前是一個以檔案為中心的靜態部落格，核心特徵是：

- 入口型首頁
- 各分類文章列表殼頁
- 共用單篇文章渲染器
- 文章原始檔以獨立 HTML 形式儲存
- 本機預覽依賴 manifest
- 正式站可搭配 GitHub API 載入文章清單

後續擴充時，請維持這個分工：

- 首頁負責導覽與摘要
- 分類頁負責文章列表
- 文章頁負責完整內文

如果不確定該怎麼改，請優先選擇「最小改動、但不破壞目前文章管線」的做法。
