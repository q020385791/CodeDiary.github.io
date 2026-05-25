(function () {
    const repoName = "CodeDiary.github.io";

    const categoryList = [
        {
            slug: "music",
            label: "音樂",
            shortLabel: "Music",
            description: "收錄編曲、作曲、混音、靈感、歌單整理與作品發布紀錄。",
            page: "music.html"
        },
        {
            slug: "programming",
            label: "程式",
            shortLabel: "Programming",
            description: "整理程式教學、實作筆記、除錯過程、工具整理與研究心得。",
            page: "programming.html"
        },
        {
            slug: "drawing",
            label: "繪畫",
            shortLabel: "Drawing",
            description: "放角色設計、草稿、完稿、風格練習與視覺發想紀錄。",
            page: "drawing.html"
        },
        {
            slug: "max",
            label: "3DMAX",
            shortLabel: "3DMAX",
            description: "整理建模、材質、場景、燈光、輸出設定與練習過程。",
            page: "3dmax.html"
        },
        {
            slug: "unity",
            label: "Unity",
            shortLabel: "Unity",
            description: "可整理系統設計、UI、場景組裝、功能實作與開發備忘錄。",
            page: "unity.html"
        },
        {
            slug: "game-dev",
            label: "遊戲",
            shortLabel: "Game Dev",
            description: "放遊戲企劃、機制設計、系統草圖、開發心得與測試紀錄。",
            page: "game.html"
        },
        {
            slug: "dream-bureau",
            label: "夢境管理局",
            shortLabel: "Dream Bureau",
            description: "專門放《夢境管理局》開發中的資訊、里程碑、週報與待辦事項。",
            page: "dream-bureau.html"
        }
    ];

    const categoryMap = Object.fromEntries(
        categoryList.map((category) => [category.slug, category])
    );

    function getBasePath() {
        const segments = window.location.pathname.split("/").filter(Boolean);

        if (segments.length && segments[0] === repoName) {
            return `/${repoName}`;
        }

        return "";
    }

    function withBasePath(path) {
        const basePath = getBasePath();
        const cleanPath = String(path || "").replace(/^\/+/, "");

        if (!cleanPath) {
            return basePath ? `${basePath}/` : "./";
        }

        return basePath ? `${basePath}/${cleanPath}` : cleanPath;
    }

    function getCategory(slug) {
        return categoryMap[slug] || null;
    }

    function getHomeUrl() {
        return withBasePath("index.html");
    }

    function getCategoryPageUrl(slug) {
        const category = getCategory(slug);
        return category ? withBasePath(category.page) : getHomeUrl();
    }

    function getArticleSourcePath(categorySlug, fileName) {
        return `articles/${categorySlug}/${fileName}`;
    }

    function getArticleUrl(categorySlug, articleSlug) {
        const query = new URLSearchParams({
            category: categorySlug,
            slug: articleSlug
        });

        return `${withBasePath("article.html")}?${query.toString()}`;
    }

    function slugFromFileName(fileName) {
        return String(fileName || "").replace(/\.[^/.]+$/, "");
    }

    function prettifySlug(slug) {
        return String(slug || "")
            .replace(/[-_]+/g, " ")
            .replace(/\b\w/g, (value) => value.toUpperCase());
    }

    function formatDate(dateString) {
        if (!dateString) {
            return "未填寫日期";
        }

        const date = new Date(dateString);

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}.${month}.${day}`;
    }

    window.CodeDiarySite = {
        repoName,
        repoOwner: "q020385791",
        categoryList,
        getBasePath,
        withBasePath,
        getCategory,
        getHomeUrl,
        getCategoryPageUrl,
        getArticleSourcePath,
        getArticleUrl,
        slugFromFileName,
        prettifySlug,
        formatDate,
        isGitHubPagesHost() {
            const hostname = window.location.hostname.toLowerCase();
            return hostname.endsWith(".github.io");
        }
    };
})();
