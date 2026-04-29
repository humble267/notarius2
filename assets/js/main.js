const pageLinks = document.querySelectorAll("[data-page-link]");
const pages = document.querySelectorAll(".page");
const mainNav = document.getElementById("main-nav");
const burger = document.getElementById("burger");
const searchModal = document.getElementById("search-modal");
const searchOpenBtn = document.getElementById("open-search");
const searchCloseBtn = document.getElementById("close-search");
const searchInput = document.getElementById("site-search-input");
const searchResults = document.getElementById("search-results");

function normalizePageName(name) {
  return name && name.trim() ? name.trim() : "home";
}

function closeMenu() {
  mainNav.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
}

function setActiveNav(name) {
  pageLinks.forEach((link) => {
    const isActive = link.dataset.pageLink === name;
    if (link.closest("nav")) {
      link.classList.toggle("active", isActive);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    }
  });
}

function initReveal() {
  document.querySelectorAll(".page.active .reveal").forEach((element) => {
    if (!element.classList.contains("visible")) {
      revealObs.observe(element);
    }
  });
}

function scrollToTarget(targetId) {
  if (!targetId) return;
  const target = document.getElementById(targetId);
  if (!target) return;
  setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

function showPage(name, updateHash = true, clearHighlights = true, scrollTarget = "") {
  const pageName = normalizePageName(name);
  const targetPage = document.getElementById(`page-${pageName}`) || document.getElementById("page-home");

  pages.forEach((page) => page.classList.remove("active"));
  targetPage.classList.add("active");

  setActiveNav(targetPage.id.replace("page-", ""));
  closeMenu();
  if (clearHighlights) {
    clearSearchHighlights();
  }
  initReveal();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (updateHash) {
    history.replaceState(null, "", `#${targetPage.id.replace("page-", "")}`);
  }

  scrollToTarget(scrollTarget);
}

function getCurrentPageFromHash() {
  return normalizePageName(window.location.hash.replace("#", ""));
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const pageName = event.currentTarget.dataset.pageLink;
    if (!pageName) return;
    event.preventDefault();
    showPage(pageName, true, true, event.currentTarget.dataset.scrollTarget || "");
  });
});

burger.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(isOpen));
});

window.addEventListener("hashchange", () => {
  showPage(getCurrentPageFromHash(), false);
});

function clearSearchHighlights() {
  const parentsToNormalize = new Set();

  document.querySelectorAll("mark.search-hit").forEach((mark) => {
    if (mark.parentNode) {
      parentsToNormalize.add(mark.parentNode);
    }
    mark.replaceWith(document.createTextNode(mark.textContent));
  });

  parentsToNormalize.forEach((parent) => parent.normalize());
}

function highlightInElement(root, query) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  const normalizedQuery = query.toLowerCase();

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parentTag = node.parentElement ? node.parentElement.tagName : "";
    if (!node.nodeValue || !node.nodeValue.trim()) continue;
    if (["SCRIPT", "STYLE", "MARK"].includes(parentTag)) continue;
    textNodes.push(node);
  }

  const matches = [];

  textNodes.forEach((node) => {
    const original = node.nodeValue;
    const lower = original.toLowerCase();
    let from = 0;
    let index = lower.indexOf(normalizedQuery, from);

    if (index === -1) return;

    const fragment = document.createDocumentFragment();

    while (index !== -1) {
      if (index > from) {
        fragment.appendChild(document.createTextNode(original.slice(from, index)));
      }

      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = original.slice(index, index + normalizedQuery.length);
      fragment.appendChild(mark);
      matches.push(mark);

      from = index + normalizedQuery.length;
      index = lower.indexOf(normalizedQuery, from);
    }

    if (from < original.length) {
      fragment.appendChild(document.createTextNode(original.slice(from)));
    }

    node.parentNode.replaceChild(fragment, node);
  });

  return matches;
}

function openSearch() {
  searchModal.classList.add("open");
  searchModal.setAttribute("aria-hidden", "false");
  searchInput.focus();
}

function closeSearch() {
  searchModal.classList.remove("open");
  searchModal.setAttribute("aria-hidden", "true");
}

function renderSearchResults(query) {
  const trimmed = query.trim();
  clearSearchHighlights();

  if (!trimmed) {
    searchResults.innerHTML = '<p class="search-empty">Почніть вводити запит, і я покажу, де на сайті є збіги.</p>';
    return;
  }

  const results = [];

  pages.forEach((page) => {
    const matches = highlightInElement(page, trimmed);
    if (!matches.length) return;

    const pageName = page.id.replace("page-", "");
    const title = page.dataset.pageTitle || page.querySelector("h1, h2")?.textContent || "Сторінка";
    results.push({ pageName, title, count: matches.length });
  });

  if (!results.length) {
    searchResults.innerHTML = `<p class="search-empty">За запитом “${trimmed}” нічого не знайдено.</p>`;
    return;
  }

  searchResults.innerHTML = results.map((result) => `
    <button class="search-result" type="button" data-result-page="${result.pageName}">
      <span class="search-result-title">${result.title}</span>
      <span class="search-result-meta">Збігів: ${result.count}</span>
    </button>
  `).join("");

  searchResults.querySelectorAll("[data-result-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const pageName = button.dataset.resultPage;
      showPage(pageName, true, false);
      closeSearch();
      const firstMatch = document.querySelector(`#page-${pageName} mark.search-hit`);
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });
}

searchOpenBtn.addEventListener("click", openSearch);
searchCloseBtn.addEventListener("click", closeSearch);
searchModal.addEventListener("click", (event) => {
  if (event.target === searchModal) closeSearch();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && searchModal.classList.contains("open")) {
    closeSearch();
  }
});

searchInput.addEventListener("input", (event) => {
  renderSearchResults(event.target.value);
});

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add("visible"), index * 100);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

function initStackCarousel(stackId, navId) {
  const stack = document.getElementById(stackId);
  const nav = document.getElementById(navId);
  if (!stack || !nav) return;

  const photos = Array.from(stack.querySelectorAll(".stack-photo"));
  if (!photos.length) return;

  let current = 0;
  let timer = null;
  let touchStartX = 0;

  function buildNav() {
    nav.innerHTML = "";
    photos.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `photo-dot${index === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `Показати слайд ${index + 1}`);
      dot.addEventListener("click", () => {
        current = index;
        render();
        resetTimer();
      });
      nav.appendChild(dot);
    });
  }

  function render() {
    const length = photos.length;

    photos.forEach((photo, index) => {
      const offset = (index - current + length) % length;
      photo.style.zIndex = String(length - offset);
      photo.style.opacity = offset === 0 ? "1" : offset === 1 ? "0.7" : offset === 2 ? "0.4" : "0";
      photo.style.transform = offset === 0
        ? "translateY(0) scale(1)"
        : offset === 1
          ? "translateY(14px) scale(0.97)"
          : offset === 2
            ? "translateY(26px) scale(0.94)"
            : "translateY(38px) scale(0.91)";
    });

    nav.querySelectorAll(".photo-dot").forEach((dot, index) => {
      dot.classList.toggle("active", index === current);
    });
  }

  function next() {
    current = (current + 1) % photos.length;
    render();
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(next, 3500);
  }

  buildNav();
  render();
  resetTimer();

  stack.addEventListener("touchstart", (event) => {
    touchStartX = event.touches[0].clientX;
  });

  stack.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) <= 40) return;

    current = deltaX < 0
      ? (current + 1) % photos.length
      : (current - 1 + photos.length) % photos.length;

    render();
    resetTimer();
  });
}

initStackCarousel("photo-stack", "photo-nav");
initStackCarousel("reviews-stack", "reviews-nav");
showPage(getCurrentPageFromHash(), false);
