(function () {
    const fallbackCategories = [
        { slug: "music", label: "音樂", shortLabel: "Music" },
        { slug: "programming", label: "程式", shortLabel: "Programming" },
        { slug: "drawing", label: "繪畫", shortLabel: "Drawing" },
        { slug: "max", label: "3DMAX", shortLabel: "3DMAX" },
        { slug: "unity", label: "Unity", shortLabel: "Unity" },
        { slug: "game-dev", label: "遊戲", shortLabel: "Game Dev" },
        { slug: "dream-bureau", label: "夢境管理局", shortLabel: "Dream Bureau" }
    ];
    const categories = (window.CodeDiarySite && window.CodeDiarySite.categoryList) || fallbackCategories;
    const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category]));
    const draftState = {
        articlesRootHandle: null,
        slugTouched: false,
        eyebrowTouched: false
    };
    const snippetMap = {
        section: [
            "<section>",
            "    <h2>段落標題</h2>",
            "    <p>在這裡補上這個段落的內容。</p>",
            "</section>"
        ].join("\n"),
        quote: [
            "<blockquote>",
            "    <p>這裡可以放引用句、摘錄或重點整理。</p>",
            "</blockquote>"
        ].join("\n"),
        code: [
            "<section>",
            "    <h2>程式碼範例</h2>",
            "    <pre><code>// 在這裡貼上程式碼</code></pre>",
            "</section>"
        ].join("\n"),
        image: [
            "<section>",
            "    <h2>圖片區塊</h2>",
            "    <img src=\"../images/example.png\" alt=\"請補上圖片說明\" />",
            "</section>"
        ].join("\n")
    };

    const form = document.querySelector("#articleForm");
    const categoryField = document.querySelector("#categoryField");
    const saveModeField = document.querySelector("#saveModeField");
    const titleField = document.querySelector("#titleField");
    const slugField = document.querySelector("#slugField");
    const summaryField = document.querySelector("#summaryField");
    const eyebrowField = document.querySelector("#eyebrowField");
    const publishedField = document.querySelector("#publishedField");
    const updatedField = document.querySelector("#updatedField");
    const pinnedField = document.querySelector("#pinnedField");
    const contentField = document.querySelector("#contentField");
    const outputPathLabel = document.querySelector("#outputPathLabel");
    const articlesBindingLabel = document.querySelector("#articlesBindingLabel");
    const previewArticle = document.querySelector("#previewArticle");
    const previewCategoryLabel = document.querySelector("#previewCategoryLabel");
    const previewPublishedLabel = document.querySelector("#previewPublishedLabel");
    const previewUpdatedLabel = document.querySelector("#previewUpdatedLabel");
    const previewPinnedLabel = document.querySelector("#previewPinnedLabel");
    const statusCard = document.querySelector("#statusCard");
    const fillDefaultsButton = document.querySelector("#fillDefaultsButton");
    const bindArticlesButton = document.querySelector("#bindArticlesButton");
    const saveArticleButton = document.querySelector("#saveArticleButton");
    const downloadButton = document.querySelector("#downloadButton");
    const copyButton = document.querySelector("#copyButton");

    init();

    function init() {
        populateCategories();
        applyDefaults({ announce: false, rerender: false });
        bindEvents();
        updateSaveModeUI();
        updateOutputPath();
        updateArticlesBindingLabel();
        renderPreview();
        setStatus("準備完成", "先填資料，選擇儲存模式，之後就可以直接存草稿或發佈。", "success");
    }

    function populateCategories() {
        categoryField.innerHTML = categories
            .map((category) => `<option value="${escapeHtml(category.slug)}">${escapeHtml(category.label)}</option>`)
            .join("");
    }

    function bindEvents() {
        form.addEventListener("input", handleFormInput);
        categoryField.addEventListener("change", handleCategoryChange);
        saveModeField.addEventListener("change", handleSaveModeChange);
        slugField.addEventListener("input", handleSlugInput);
        eyebrowField.addEventListener("input", handleEyebrowInput);
        fillDefaultsButton.addEventListener("click", () => applyDefaults({ announce: true, rerender: true }));
        bindArticlesButton.addEventListener("click", bindArticlesDirectory);
        saveArticleButton.addEventListener("click", saveArticle);
        downloadButton.addEventListener("click", downloadHtml);
        copyButton.addEventListener("click", copyHtml);

        document.querySelectorAll(".snippet-button").forEach((button) => {
            button.addEventListener("click", () => insertSnippet(button.dataset.snippet));
        });
    }

    function handleFormInput(event) {
        if (event.target === titleField && !draftState.slugTouched) {
            slugField.value = buildSlug(titleField.value) || buildFallbackSlug(false);
        }

        if (event.target === categoryField && !draftState.eyebrowTouched) {
            eyebrowField.value = getSelectedCategory().shortLabel || getSelectedCategory().label;
        }

        if (event.target === publishedField && !updatedField.value) {
            updatedField.value = publishedField.value;
        }

        updateOutputPath();
        renderPreview();
    }

    function handleCategoryChange() {
        if (!draftState.eyebrowTouched) {
            eyebrowField.value = getSelectedCategory().shortLabel || getSelectedCategory().label;
        }

        updateOutputPath();
        renderPreview();
    }

    function handleSaveModeChange() {
        updateSaveModeUI();
        updateOutputPath();
        setStatus(
            getSaveMode() === "publish" ? "已切換為直接發佈" : "已切換為草稿模式",
            getSaveMode() === "publish"
                ? "接下來儲存時會寫進對應分類資料夾，並自動更新 manifest。"
                : "接下來儲存時會寫進 articles/draft，不會影響分類頁列表。",
            "success"
        );
    }

    function handleSlugInput() {
        draftState.slugTouched = true;
        slugField.value = slugField.value.replace(/\.html$/i, "").trim();
        updateOutputPath();
        renderPreview();
    }

    function handleEyebrowInput() {
        draftState.eyebrowTouched = true;
        renderPreview();
    }

    function getSelectedCategory() {
        return categoryMap[categoryField.value] || categories[0];
    }

    function getSaveMode() {
        return saveModeField.value === "publish" ? "publish" : "draft";
    }

    function getTodayString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    function buildFallbackSlug(includeSeconds) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hour = String(date.getHours()).padStart(2, "0");
        const minute = String(date.getMinutes()).padStart(2, "0");
        const second = String(date.getSeconds()).padStart(2, "0");
        return includeSeconds
            ? `draft-${year}${month}${day}-${hour}${minute}${second}`
            : `draft-${year}${month}${day}-${hour}${minute}`;
    }

    function buildSlug(source) {
        return String(source || "")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .replace(/-{2,}/g, "-");
    }

    function stripHtml(html) {
        return String(html || "")
            .replace(/<style[\s\S]*?<\/style>/gi, " ")
            .replace(/<script[\s\S]*?<\/script>/gi, " ")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    function buildSummaryFromContent(content) {
        const plainText = stripHtml(content).replace(/\s+/g, " ").trim();
        if (!plainText) {
            return "";
        }

        return plainText.length > 90 ? `${plainText.slice(0, 90).trim()}...` : plainText;
    }

    function normalizeContent(rawContent) {
        const content = String(rawContent || "").trim();

        if (!content) {
            return [
                "<section>",
                "    <h2>待補內容</h2>",
                "    <p>這是一篇新的草稿文章，請在這裡補上正文內容。</p>",
                "</section>"
            ].join("\n");
        }

        if (/<[a-z][\s\S]*>/i.test(content)) {
            return content;
        }

        return content
            .split(/\n{2,}/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean)
            .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
            .join("\n\n");
    }

    function applyDefaults(options) {
        const filledFields = [];
        const selectedCategory = getSelectedCategory();

        if (!categoryField.value) {
            categoryField.value = categories[0].slug;
            filledFields.push("分類");
        }

        if (!publishedField.value) {
            publishedField.value = getTodayString();
            filledFields.push("發布日期");
        }

        if (!updatedField.value) {
            updatedField.value = publishedField.value;
            filledFields.push("更新日期");
        }

        if (!titleField.value.trim()) {
            titleField.value = `未命名草稿 ${publishedField.value || getTodayString()}`;
            filledFields.push("文章標題");
        }

        if (!slugField.value.trim()) {
            slugField.value = buildSlug(titleField.value) || buildFallbackSlug(false);
            filledFields.push("slug");
        }

        if (!eyebrowField.value.trim()) {
            eyebrowField.value = selectedCategory.shortLabel || selectedCategory.label;
            filledFields.push("eyebrow");
        }

        if (!contentField.value.trim()) {
            contentField.value = normalizeContent("");
            filledFields.push("內文");
        }

        if (!summaryField.value.trim()) {
            summaryField.value = buildSummaryFromContent(contentField.value) || `${titleField.value.trim()}。`;
            filledFields.push("摘要");
        }

        updateOutputPath();

        if (!options || options.rerender !== false) {
            renderPreview();
        }

        if (options && options.announce) {
            if (filledFields.length) {
                setStatus(
                    "必要欄位已補齊",
                    `這次自動補上：${filledFields.join("、")}。你還可以繼續手動調整內容。`,
                    "success"
                );
            } else {
                setStatus("欄位已完整", "目前必要欄位都已填好，可以直接存成草稿或發佈。", "success");
            }
        }
    }

    function getFormValues() {
        applyDefaults({ announce: false, rerender: false });

        const slug = (slugField.value.trim() || buildFallbackSlug(true)).replace(/\.html$/i, "");
        const category = getSelectedCategory();
        const contentHtml = normalizeContent(contentField.value);

        return {
            categorySlug: category.slug,
            categoryLabel: category.label,
            eyebrow: eyebrowField.value.trim() || category.shortLabel || category.label,
            title: titleField.value.trim(),
            slug,
            summary: summaryField.value.trim() || buildSummaryFromContent(contentHtml) || `${titleField.value.trim()}。`,
            published: publishedField.value || getTodayString(),
            updated: updatedField.value || publishedField.value || getTodayString(),
            pinned: Boolean(pinnedField?.checked),
            contentHtml
        };
    }

    function buildArticleHtml(values) {
        return (
            [
            "<!DOCTYPE html>",
            '<html lang="zh-Hant">',
            "<head>",
            '    <meta charset="utf-8" />',
            `    <title>${escapeHtml(values.title)}</title>`,
            `    <meta name="description" content="${escapeHtml(values.summary)}" />`,
            `    <meta name="article:category" content="${escapeHtml(values.categorySlug)}" />`,
            `    <meta name="article:published" content="${escapeHtml(values.published)}" />`,
            `    <meta name="article:updated" content="${escapeHtml(values.updated)}" />`,
            values.pinned ? '    <meta name="article:pinned" content="true" />' : "",
            "</head>",
            "<body>",
            '    <article class="article-template">',
            '        <header class="article-header">',
            `            <p class="post-eyebrow">${escapeHtml(values.eyebrow)}</p>`,
            `            <h1>${escapeHtml(values.title)}</h1>`,
            `            <p class="post-summary">${escapeHtml(values.summary)}</p>`,
            "        </header>",
            indentHtml(values.contentHtml, 2),
            "    </article>",
            "</body>",
            "</html>"
            ]
                .filter((line) => line !== "")
                .join("\n") + "\n"
        );
    }

    function indentHtml(html, indentLevel) {
        const indentation = "    ".repeat(indentLevel);
        return String(html || "")
            .trim()
            .split("\n")
            .map((line) => `${indentation}${line}`)
            .join("\n");
    }

    function renderPreview() {
        const values = getFormValues();
        const articleMarkup = `
            <article class="article-template">
                <header class="article-header">
                    <p class="post-eyebrow">${escapeHtml(values.eyebrow)}</p>
                    <h1>${escapeHtml(values.title)}</h1>
                    <p class="post-summary">${escapeHtml(values.summary)}</p>
                </header>
                ${values.contentHtml}
            </article>
        `;

        previewArticle.innerHTML = articleMarkup;
        previewCategoryLabel.textContent = values.categoryLabel;
        previewPublishedLabel.textContent = formatDisplayDate(values.published);
        previewUpdatedLabel.textContent = formatDisplayDate(values.updated);
        previewPinnedLabel.textContent = values.pinned ? "置頂文章" : "一般排序";
    }

    function formatDisplayDate(dateString) {
        return String(dateString || "").replaceAll("-", ".");
    }

    function updateOutputPath() {
        const slug = slugField.value.trim().replace(/\.html$/i, "") || "draft-article";
        const categorySlug = getSelectedCategory().slug;

        outputPathLabel.textContent =
            getSaveMode() === "publish"
                ? `articles/${categorySlug}/${slug}.html`
                : `articles/draft/${slug}.html`;
    }

    function updateArticlesBindingLabel() {
        articlesBindingLabel.textContent = draftState.articlesRootHandle
            ? `已綁定：${draftState.articlesRootHandle.name}`
            : "尚未綁定";
    }

    function updateSaveModeUI() {
        saveArticleButton.textContent =
            getSaveMode() === "publish" ? "直接發佈並更新 manifest" : "存到 articles/draft";
        bindArticlesButton.textContent = draftState.articlesRootHandle
            ? "重新綁定 articles 資料夾"
            : "綁定 articles 資料夾";
    }

    async function bindArticlesDirectory() {
        if (!window.showDirectoryPicker) {
            setStatus(
                "瀏覽器不支援直接存資料夾",
                "目前瀏覽器不支援 File System Access API。可以改用下載 HTML，再手動放進 articles 相關資料夾。",
                "warning"
            );
            return null;
        }

        try {
            const directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
            const looksValid = await looksLikeArticlesRoot(directoryHandle);

            if (!looksValid) {
                setStatus(
                    "請選正確資料夾",
                    "這個資料夾看起來不是 repo 內的 articles 根目錄。請改選含有 manifest.json 的 articles 資料夾。",
                    "warning"
                );
                return null;
            }

            draftState.articlesRootHandle = directoryHandle;
            updateArticlesBindingLabel();
            updateSaveModeUI();
            setStatus(
                "articles 資料夾已綁定",
                "之後這個分頁可以直接寫入 draft 或分類資料夾；若是直接發佈，也會一併更新 manifest。",
                "success"
            );

            return directoryHandle;
        } catch (error) {
            if (error && error.name === "AbortError") {
                setStatus("已取消綁定", "你沒有選擇資料夾，稍後存檔時仍可再重新選一次。", "warning");
                return null;
            }

            setStatus("綁定失敗", error.message || "無法取得資料夾權限。", "error");
            return null;
        }
    }

    async function looksLikeArticlesRoot(directoryHandle) {
        if (!directoryHandle) {
            return false;
        }

        if (directoryHandle.name === "articles") {
            return true;
        }

        try {
            await directoryHandle.getFileHandle("manifest.json");
            return true;
        } catch (error) {
            return false;
        }
    }

    async function ensureArticlesRootHandle() {
        let directoryHandle = draftState.articlesRootHandle;

        if (!directoryHandle) {
            directoryHandle = await bindArticlesDirectory();
        }

        return directoryHandle;
    }

    async function ensureWritePermission(directoryHandle) {
        if (!directoryHandle || !directoryHandle.requestPermission) {
            return true;
        }

        const permission = await directoryHandle.requestPermission({ mode: "readwrite" });
        return permission === "granted";
    }

    async function writeTextFile(directoryHandle, fileName, contents) {
        const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(contents);
        await writable.close();
    }

    async function readManifest(directoryHandle) {
        try {
            const fileHandle = await directoryHandle.getFileHandle("manifest.json");
            const file = await fileHandle.getFile();
            const text = await file.text();
            return text.trim() ? JSON.parse(text) : {};
        } catch (error) {
            if (error && error.name === "NotFoundError") {
                return {};
            }

            throw error;
        }
    }

    function sortFileNames(fileNames) {
        return [...fileNames].sort((left, right) =>
            String(left).localeCompare(String(right), "zh-Hant", {
                numeric: true,
                sensitivity: "base"
            })
        );
    }

    function normalizeManifest(manifest) {
        const normalized = {};

        categories.forEach((category) => {
            const fileNames = Array.isArray(manifest[category.slug]) ? manifest[category.slug] : [];
            normalized[category.slug] = sortFileNames(
                fileNames.filter((fileName) => String(fileName).toLowerCase().endsWith(".html"))
            );
        });

        Object.keys(manifest)
            .filter((key) => !Object.hasOwn(normalized, key) && key !== "draft")
            .sort((left, right) => left.localeCompare(right, "zh-Hant", { sensitivity: "base" }))
            .forEach((key) => {
                normalized[key] = manifest[key];
            });

        return normalized;
    }

    async function updateManifestForPublishedArticle(directoryHandle, values) {
        const manifest = await readManifest(directoryHandle);
        const fileName = `${values.slug}.html`;
        const nextManifest = normalizeManifest(manifest);
        const existingFiles = Array.isArray(nextManifest[values.categorySlug]) ? nextManifest[values.categorySlug] : [];

        nextManifest[values.categorySlug] = sortFileNames(Array.from(new Set([...existingFiles, fileName])));
        await writeTextFile(directoryHandle, "manifest.json", `${JSON.stringify(nextManifest, null, 4)}\n`);
    }

    async function saveArticle() {
        const values = getFormValues();
        const html = buildArticleHtml(values);
        const articlesRootHandle = await ensureArticlesRootHandle();

        if (!articlesRootHandle) {
            return;
        }

        try {
            if (!(await ensureWritePermission(articlesRootHandle))) {
                setStatus("未取得寫入權限", "瀏覽器尚未允許寫入該資料夾，因此這次沒有存檔。", "warning");
                return;
            }

            if (getSaveMode() === "publish") {
                const categoryDirectoryHandle = await articlesRootHandle.getDirectoryHandle(values.categorySlug, {
                    create: true
                });

                await writeTextFile(categoryDirectoryHandle, `${values.slug}.html`, html);
                await updateManifestForPublishedArticle(articlesRootHandle, values);

                setStatus(
                    "文章已發佈",
                    `已寫入 articles/${values.categorySlug}/${values.slug}.html，並更新 manifest。重新整理該分類頁後就會出現。`,
                    "success"
                );
                return;
            }

            const draftDirectoryHandle = await articlesRootHandle.getDirectoryHandle("draft", { create: true });
            await writeTextFile(draftDirectoryHandle, `${values.slug}.html`, html);

            setStatus(
                "草稿已儲存",
                `已寫入 articles/draft/${values.slug}.html。之後若要直接出現在分類頁，把儲存模式切到「直接發佈」再存一次即可。`,
                "success"
            );
        } catch (error) {
            setStatus("存檔失敗", error.message || "寫入檔案時發生問題。", "error");
        }
    }

    function downloadHtml() {
        const values = getFormValues();
        const html = buildArticleHtml(values);
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${values.slug}.html`;
        anchor.click();
        URL.revokeObjectURL(url);

        setStatus(
            "已下載 HTML",
            `已下載 ${values.slug}.html。若要手動放入站內，目標路徑可參考上方的預計輸出。`,
            "success"
        );
    }

    async function copyHtml() {
        const html = buildArticleHtml(getFormValues());

        try {
            await navigator.clipboard.writeText(html);
            setStatus("HTML 已複製", "整份文章 HTML 已經放到剪貼簿，可以直接貼到其他地方。", "success");
        } catch (error) {
            setStatus("複製失敗", error.message || "瀏覽器無法使用剪貼簿功能。", "error");
        }
    }

    function insertSnippet(snippetKey) {
        const snippet = snippetMap[snippetKey];

        if (!snippet) {
            return;
        }

        const { selectionStart, selectionEnd, value } = contentField;
        const prefix = value && !value.endsWith("\n") ? "\n\n" : "";
        const nextValue =
            value.slice(0, selectionStart) +
            prefix +
            snippet +
            value.slice(selectionEnd);

        contentField.value = nextValue;
        contentField.focus();
        renderPreview();
    }

    function setStatus(title, body, tone) {
        statusCard.className = "status-card";

        if (tone) {
            statusCard.classList.add(`is-${tone}`);
        }

        statusCard.innerHTML = `
            <p class="status-title">${escapeHtml(title)}</p>
            <p class="status-body">${escapeHtml(body)}</p>
        `;
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
})();
