document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("sectionSelect");
    const navLinks = Array.from(document.querySelectorAll(".tree-nav a[href^='#']"));
    const placeholderLinks = Array.from(document.querySelectorAll("a[href='#']"));
    const trackedSections = Array.from(document.querySelectorAll("main > [id]"));
    const yearNode = document.getElementById("currentYear");

    if (yearNode) {
        yearNode.textContent = String(new Date().getFullYear());
    }

    const activateLink = (hash) => {
        navLinks.forEach((link) => {
            link.classList.toggle("is-active", link.getAttribute("href") === hash);
        });

        if (select && select.value !== hash) {
            select.value = hash;
        }

        const activeLink = navLinks.find((link) => link.getAttribute("href") === hash);
        const parentDetails = activeLink ? activeLink.closest("details") : null;

        if (parentDetails) {
            parentDetails.open = true;
        }
    };

    const scrollToHash = (hash) => {
        const target = document.querySelector(hash);

        if (!target) {
            return;
        }

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        try {
            history.replaceState(null, "", hash);
        } catch (error) {
            window.location.hash = hash;
        }

        activateLink(hash);
    };

    const navigateValue = (value) => {
        if (!value) {
            return;
        }

        if (value.startsWith("#")) {
            scrollToHash(value);
            return;
        }

        window.location.href = value;
    };

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const hash = link.getAttribute("href");

            if (!hash) {
                return;
            }

            event.preventDefault();
            scrollToHash(hash);
        });
    });

    if (select) {
        select.addEventListener("change", (event) => {
            navigateValue(event.target.value);
        });
    }

    placeholderLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
        });
    });

    const observer = new IntersectionObserver(
        (entries) => {
            const visibleEntries = entries
                .filter((entry) => entry.isIntersecting)
                .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

            if (!visibleEntries.length) {
                return;
            }

            activateLink(`#${visibleEntries[0].target.id}`);
        },
        {
            rootMargin: "-18% 0px -55% 0px",
            threshold: [0.2, 0.35, 0.5]
        }
    );

    trackedSections.forEach((section) => observer.observe(section));

    const initialHash = window.location.hash && document.querySelector(window.location.hash)
        ? window.location.hash
        : "#top";

    activateLink(initialHash);
    loadVisitorInfo();
});

async function loadVisitorInfo() {
    const statusNode = document.getElementById("visitorStatus");
    const ipNode = document.getElementById("visitorIp");
    const locationNode = document.getElementById("visitorLocation");

    if (!statusNode || !ipNode || !locationNode) {
        return;
    }

    try {
        const response = await fetch("https://api.db-ip.com/v2/free/self");

        if (!response.ok) {
            throw new Error(`Visitor lookup failed: ${response.status}`);
        }

        const data = await response.json();
        const locationParts = [data.continentName, data.countryName, data.city].filter(Boolean);

        ipNode.textContent = data.ipAddress || "--";
        locationNode.textContent = locationParts.length ? locationParts.join(" / ") : "--";
        statusNode.textContent = "歡迎來訪，這裡會顯示目前的訪客來源資訊。";
    } catch (error) {
        console.error(error);
        statusNode.textContent = "位置資訊暫時無法取得，網站內容仍可正常瀏覽。";
        ipNode.textContent = "--";
        locationNode.textContent = "--";
    }
}
