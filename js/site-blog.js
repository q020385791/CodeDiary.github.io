document.addEventListener("DOMContentLoaded", () => {
    const root = document.getElementById("blogApp");
    const pageType = document.body.dataset.page;

    if (!root || !window.CodeDiarySite) {
        return;
    }

    if (pageType === "category") {
        renderCategoryPage(root).catch((error) => {
            console.error(error);
            renderErrorState(root, "文章列表頁暫時無法載入，請稍後再試。");
        });
        return;
    }

    if (pageType === "article") {
        renderArticlePage(root).catch((error) => {
            console.error(error);
            renderErrorState(root, "文章內文暫時無法載入，請確認連結與檔案是否存在。");
        });
    }
});

async function renderCategoryPage(root) {
    const site = window.CodeDiarySite;
    const categorySlug = document.body.dataset.category;
    const category = site.getCategory(categorySlug);

    if (!category) {
        renderErrorState(root, "找不到這個分類設定。");
        return;
    }

    document.title = `CodeDiary | ${category.label}文章列表`;

    root.innerHTML = `
        <div class="blog-shell">
            ${buildSidebar(categorySlug)}
            <main class="blog-main">
                <section class="page-hero">
                    <div>
                        <p class="eyebrow">Article List</p>
                        <h1>${escapeHtml(category.label)}</h1>
                        <p class="hero-copy">${escapeHtml(category.description)}</p>
                    </div>
                    <div class="hero-panel">
                        <p class="eyebrow eyebrow-light">新增文章方式</p>
                        <p>把新的 HTML 檔放進 <code>articles/${escapeHtml(category.slug)}/</code>，這個列表就會自動多出一篇。</p>
                        <p>如果這個分類目前是空的，可以直接用文章產生器建立草稿，再移進這個分類資料夾。</p>
                        <p>如果是本機預覽，新增文章後也請同步更新 <code>articles/manifest.json</code>。</p>
                    </div>
                </section>

                <section class="panel-section">
                    <div class="section-head">
                        <div>
                            <p class="eyebrow">Posts</p>
                            <h2>文章列表</h2>
                        </div>
                        <p class="section-note" id="articleCount">正在讀取文章...</p>
                    </div>
                    <div class="article-grid" id="articleList">
                        ${buildLoadingCards()}
                    </div>
                </section>
            </main>
        </div>
    `;

    setupSidebarSelect(root);

    const articles = await loadCategoryArticles(categorySlug);
    const countNode = root.querySelector("#articleCount");
    const listNode = root.querySelector("#articleList");

    if (countNode) {
        countNode.textContent = articles.length ? `共 ${articles.length} 篇文章` : "目前還沒有文章";
    }

    if (!listNode) {
        return;
    }

    if (!articles.length) {
        listNode.innerHTML = `
            <article class="empty-card">
                <p class="card-label">No Posts Yet</p>
                <h3>目前還沒有文章</h3>
                <p>你可以先用文章產生器建立草稿，或直接新增一篇符合格式的 HTML 文章。</p>
            </article>
        `;
        return;
    }

    listNode.innerHTML = articles
        .map((article) => buildArticleCard(article))
        .join("");
}

async function renderArticlePage(root) {
    const site = window.CodeDiarySite;
    const searchParams = new URLSearchParams(window.location.search);
    const categorySlug = searchParams.get("category");
    const articleSlug = searchParams.get("slug");
    const category = site.getCategory(categorySlug);

    if (!category || !articleSlug) {
        renderErrorState(root, "文章連結不完整，請從文章列表重新進入。");
        return;
    }

    const fileName = `${articleSlug}.html`;
    const articlePath = site.getArticleSourcePath(categorySlug, fileName);
    const response = await fetch(site.withBasePath(articlePath));

    if (!response.ok) {
        throw new Error(`Unable to load article: ${response.status}`);
    }

    const articleHtml = await response.text();
    const article = parseArticleFile(articleHtml, categorySlug, fileName);
    document.title = `CodeDiary | ${article.title}`;

    root.innerHTML = `
        <div class="blog-shell">
            ${buildSidebar(categorySlug)}
            <main class="blog-main">
                <section class="page-hero compact-hero">
                    <div>
                        <a class="back-link" href="${site.getCategoryPageUrl(categorySlug)}">返回 ${escapeHtml(category.label)}文章列表</a>
                        <p class="eyebrow">Article</p>
                        <h1>${escapeHtml(article.title)}</h1>
                        <p class="hero-copy">${escapeHtml(article.summary)}</p>
                    </div>
                    <div class="meta-panel">
                        <div>
                            <span class="meta-label">分類</span>
                            <strong>${escapeHtml(category.label)}</strong>
                        </div>
                        <div>
                            <span class="meta-label">發布</span>
                            <strong>${escapeHtml(site.formatDate(article.published))}</strong>
                        </div>
                        <div>
                            <span class="meta-label">更新</span>
                            <strong>${escapeHtml(site.formatDate(article.updated || article.published))}</strong>
                        </div>
                        ${
                            article.pinned
                                ? `
                        <div>
                            <span class="meta-label">排序</span>
                            <strong>置頂文章</strong>
                        </div>
                        `
                                : ""
                        }
                    </div>
                </section>

                <section class="panel-section">
                    <article class="article-view" id="articleView">
                        ${article.articleMarkup}
                    </article>
                </section>

                <section class="panel-section comment-section">
                    <div class="comment-card">
                        <div class="comment-header">
                            <p class="card-label">Discussion</p>
                            <h2>留言區</h2>
                            <p>歡迎在這篇文章底下留言，我會直接在 GitHub Discussions 回覆你。</p>
                        </div>
                        <div id="giscusThread"></div>
                    </div>
                </section>
            </main>
        </div>
    `;

    setupSidebarSelect(root);
    mountGiscus(root, categorySlug);
}

async function loadCategoryArticles(categorySlug) {
    const files = await loadCategoryFiles(categorySlug);
    const site = window.CodeDiarySite;

    const articles = await Promise.all(
        files.map(async (file) => {
            const response = await fetch(site.withBasePath(site.getArticleSourcePath(categorySlug, file.name)));

            if (!response.ok) {
                throw new Error(`Unable to fetch article file: ${file.name}`);
            }

            const html = await response.text();
            const article = parseArticleFile(html, categorySlug, file.name);

            return {
                ...article,
                fileName: file.name,
                slug: site.slugFromFileName(file.name),
                url: site.getArticleUrl(categorySlug, site.slugFromFileName(file.name))
            };
        })
    );

    return articles.sort(sortArticles);
}

async function loadCategoryFiles(categorySlug) {
    const site = window.CodeDiarySite;
    const loaders = site.isGitHubPagesHost()
        ? [() => loadCategoryFilesFromGitHub(categorySlug), () => loadCategoryFilesFromManifest(categorySlug)]
        : [() => loadCategoryFilesFromManifest(categorySlug), () => loadCategoryFilesFromGitHub(categorySlug)];
    const errors = [];

    for (const loadFiles of loaders) {
        try {
            return await loadFiles();
        } catch (error) {
            errors.push(error);
        }
    }

    const errorMessage = errors.length
        ? errors.map((error) => error.message).join(" | ")
        : "Unable to load article files.";
    throw new Error(errorMessage);
}

async function loadCategoryFilesFromManifest(categorySlug) {
    const site = window.CodeDiarySite;
    const response = await fetch(site.withBasePath("articles/manifest.json"));

    if (!response.ok) {
        throw new Error(`Unable to load local manifest: ${response.status}`);
    }

    const manifest = await response.json();
    const fileNames = Array.isArray(manifest[categorySlug]) ? manifest[categorySlug] : [];

    return fileNames
        .filter((fileName) => String(fileName).toLowerCase().endsWith(".html"))
        .map((fileName) => ({ name: fileName }));
}

async function loadCategoryFilesFromGitHub(categorySlug) {
    const site = window.CodeDiarySite;
    const apiUrl = `https://api.github.com/repos/${site.repoOwner}/${site.repoName}/contents/articles/${categorySlug}`;
    const response = await fetch(apiUrl, {
        headers: {
            Accept: "application/vnd.github+json"
        }
    });

    if (!response.ok) {
        throw new Error(`Unable to load GitHub directory: ${response.status}`);
    }

    const data = await response.json();

    return data.filter((item) => item.type === "file" && item.name.toLowerCase().endsWith(".html"));
}

function parseArticleFile(html, categorySlug, fileName) {
    const site = window.CodeDiarySite;
    const category = site.getCategory(categorySlug);
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(html, "text/html");
    const directBodyArticle = Array.from(documentNode.body?.children || []).find((element) =>
        element.matches("article")
    );
    const articleRoot =
        documentNode.querySelector(".article-template") ||
        documentNode.querySelector("main") ||
        directBodyArticle ||
        documentNode.querySelector("article");
    const fileSlug = site.slugFromFileName(fileName);
    const title =
        documentNode.querySelector("title")?.textContent.trim() ||
        articleRoot?.querySelector("h1")?.textContent.trim() ||
        site.prettifySlug(fileSlug);
    const summary =
        documentNode.querySelector("meta[name='description']")?.getAttribute("content")?.trim() ||
        articleRoot?.querySelector(".post-summary")?.textContent.trim() ||
        "尚未填寫摘要。";
    const published =
        documentNode.querySelector("meta[name='article:published']")?.getAttribute("content")?.trim() ||
        articleRoot?.querySelector("time")?.getAttribute("datetime") ||
        "";
    const updated =
        documentNode.querySelector("meta[name='article:updated']")?.getAttribute("content")?.trim() ||
        published;
    const pinned = parsePinnedFlag(documentNode);
    const eyebrow =
        articleRoot?.querySelector(".post-eyebrow")?.textContent.trim() ||
        category?.shortLabel ||
        category?.label ||
        "Article";
    const articleMarkup =
        articleRoot?.outerHTML ||
        `
            <article class="article-template">
                <header class="article-header">
                    <p class="post-eyebrow">${escapeHtml(eyebrow)}</p>
                    <h1>${escapeHtml(title)}</h1>
                    <p class="post-summary">${escapeHtml(summary)}</p>
                </header>
            </article>
        `;

    return {
        title,
        summary,
        published,
        updated,
        pinned,
        eyebrow,
        articleMarkup
    };
}

function parsePinnedFlag(documentNode) {
    const pinnedValue = documentNode.querySelector("meta[name='article:pinned']")?.getAttribute("content");

    if (!pinnedValue) {
        return false;
    }

    return ["1", "true", "yes", "pinned"].includes(pinnedValue.trim().toLowerCase());
}

function sortArticles(left, right) {
    if (Boolean(left.pinned) !== Boolean(right.pinned)) {
        return left.pinned ? -1 : 1;
    }

    const leftTime = Date.parse(left.published || left.updated || "");
    const rightTime = Date.parse(right.published || right.updated || "");
    const safeLeft = Number.isNaN(leftTime) ? 0 : leftTime;
    const safeRight = Number.isNaN(rightTime) ? 0 : rightTime;

    if (safeLeft !== safeRight) {
        return safeRight - safeLeft;
    }

    return left.title.localeCompare(right.title, "zh-Hant");
}

function buildSidebar(currentCategorySlug) {
    const site = window.CodeDiarySite;
    const currentCategory = site.getCategory(currentCategorySlug);

    return `
        <aside class="blog-sidebar">
            <div class="brand-block">
                <a class="brand-mark" href="${site.getHomeUrl()}">CD</a>
                <div>
                    <p class="eyebrow">CodeDiary</p>
                    <h2>文章列表與內文頁</h2>
                </div>
            </div>

            <p class="sidebar-copy">
                這裡是部落格的分類內頁。從分類文章列表點進去，就會進入單篇文章內容。
            </p>

            <label class="select-label" for="pageSelect">快速跳轉</label>
            <select class="section-select" id="pageSelect">
                <option value="${site.getHomeUrl()}">首頁</option>
                <option value="${site.getHomeUrl()}#profile">首頁 / 個人資訊</option>
                <option value="${site.getHomeUrl()}#latest">首頁 / 最新資訊</option>
                ${site.categoryList
                    .map((category) => {
                        const selected = category.slug === currentCategorySlug ? " selected" : "";
                        return `<option value="${site.getCategoryPageUrl(category.slug)}"${selected}>${escapeHtml(category.label)}文章列表</option>`;
                    })
                    .join("")}
            </select>

            <nav class="side-tree" aria-label="分類導覽">
                <a class="side-link" href="${site.getHomeUrl()}">首頁</a>

                <details open>
                    <summary>首頁資訊</summary>
                    <a class="side-link" href="${site.getHomeUrl()}#profile">個人資訊</a>
                    <a class="side-link" href="${site.getHomeUrl()}#latest">最新資訊</a>
                    <a class="side-link" href="${site.getHomeUrl()}#categories">分類入口</a>
                </details>

                <details open>
                    <summary>文章列表</summary>
                    ${site.categoryList
                        .map((category) => {
                            const activeClass = category.slug === currentCategorySlug ? " is-active" : "";
                            return `<a class="side-link${activeClass}" href="${site.getCategoryPageUrl(category.slug)}">${escapeHtml(category.label)}</a>`;
                        })
                        .join("")}
                </details>

                <details>
                    <summary>舊頁面與實驗</summary>
                    <a class="side-link" href="${site.getHomeUrl()}#legacy">首頁 / 舊頁面整理</a>
                    <a class="side-link" href="${site.withBasePath("announcement.html")}">公告頁</a>
                    <a class="side-link" href="${site.withBasePath("Regex.html")}">Regex 工具</a>
                    <a class="side-link" href="${site.withBasePath("SideProject.html")}">小專案測試</a>
                    <a class="side-link" href="${site.withBasePath("Cube.html")}">Cube 展示</a>
                </details>
            </nav>

            <section class="sidebar-note">
                <p class="eyebrow">目前所在</p>
                <p>${escapeHtml(currentCategory?.label || "文章頁")}</p>
                <p class="muted">文章放在 <code>articles/${escapeHtml(currentCategorySlug || "")}/</code>。</p>
            </section>
        </aside>
    `;
}

function buildArticleCard(article) {
    const site = window.CodeDiarySite;
    const cardClassName = article.pinned ? "article-card is-pinned" : "article-card";
    const pinBadge = article.pinned ? '<span class="pin-badge">置頂</span>' : "";

    return `
        <a class="${cardClassName}" href="${article.url}">
            <div class="card-meta-row">
                <p class="card-label">${escapeHtml(article.eyebrow)}</p>
                ${pinBadge}
            </div>
            <time datetime="${escapeHtml(article.published || "")}">${escapeHtml(site.formatDate(article.published))}</time>
            <h3>${escapeHtml(article.title)}</h3>
            <p>${escapeHtml(article.summary)}</p>
            <span class="card-action">閱讀內文</span>
        </a>
    `;
}

function buildLoadingCards() {
    return `
        <article class="article-card is-loading">
            <p class="card-label">Loading</p>
            <h3>正在讀取文章列表...</h3>
            <p>請稍候，系統正在整理這個分類的文章。</p>
        </article>
    `;
}

function setupSidebarSelect(root) {
    const select = root.querySelector("#pageSelect");

    if (!select) {
        return;
    }

    select.addEventListener("change", (event) => {
        const nextUrl = event.target.value;

        if (!nextUrl) {
            return;
        }

        window.location.href = nextUrl;
    });
}

function renderErrorState(root, message) {
    root.innerHTML = `
        <div class="blog-shell">
            <main class="blog-main error-main">
                <section class="panel-section error-card">
                    <p class="card-label">Error</p>
                    <h1>頁面暫時無法顯示</h1>
                    <p>${escapeHtml(message)}</p>
                    <a class="back-link" href="${window.CodeDiarySite ? window.CodeDiarySite.getHomeUrl() : "index.html"}">返回首頁</a>
                </section>
            </main>
        </div>
    `;
}

function getGiscusCategoryConfig(categorySlug) {
    const fallbackConfig = {
        name: "Announcements",
        id: "DIC_kwDOEnXLcs4C9xte"
    };
    const categoryConfigMap = {
        drawing: {
            name: "Drawing",
            id: "DIC_kwDOEnXLcs4C9yQX"
        },
        "dream-bureau": {
            name: "dream-bureau",
            id: "DIC_kwDOEnXLcs4C9yPr"
        },
        "game-dev": {
            name: "game-dev",
            id: "DIC_kwDOEnXLcs4C9yPy"
        },
        max: {
            name: "3DMax",
            id: "DIC_kwDOEnXLcs4C9yPj"
        },
        music: {
            name: "Music",
            id: "DIC_kwDOEnXLcs4C9yPW"
        },
        programming: {
            name: "Programming",
            id: "DIC_kwDOEnXLcs4C9yPk"
        },
        unity: fallbackConfig
    };

    return categoryConfigMap[categorySlug] || fallbackConfig;
}

function mountGiscus(root, categorySlug) {
    const site = window.CodeDiarySite;
    const giscusContainer = root.querySelector("#giscusThread");
    const giscusCategory = getGiscusCategoryConfig(categorySlug);

    if (!site || !giscusContainer || !giscusCategory) {
        return;
    }

    if (!site.isGitHubPagesHost()) {
        giscusContainer.innerHTML = `
            <p class="comment-note">
                本機預覽已暫時隱藏留言區，避免用 localhost 建立錯誤的 discussion。
            </p>
        `;
        return;
    }

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "q020385791/CodeDiary.github.io");
    script.setAttribute("data-repo-id", "MDEwOlJlcG9zaXRvcnkzMDk3MDk2ODI=");
    script.setAttribute("data-category", giscusCategory.name);
    script.setAttribute("data-category-id", giscusCategory.id);
    script.setAttribute("data-mapping", "url");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "zh-TW");
    script.setAttribute("crossorigin", "anonymous");
    script.async = true;

    giscusContainer.appendChild(script);
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
