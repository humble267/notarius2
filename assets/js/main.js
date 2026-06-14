// ── Page Loader ────────────────────────────────────────────
(function () {
  const loader = document.getElementById("page-loader");
  if (!loader) return;

  function hideLoader() {
    loader.classList.add("loader-out");
    loader.addEventListener("transitionend", () => loader.remove(), { once: true });
  }

  const minDelay = 2900;
  const start = Date.now();

  function tryHide() {
    const elapsed = Date.now() - start;
    const wait = Math.max(0, minDelay - elapsed);
    setTimeout(hideLoader, wait);
  }

  if (document.readyState === "complete") {
    tryHide();
  } else {
    window.addEventListener("load", tryHide, { once: true });
    setTimeout(hideLoader, 5000); // fallback
  }
})();

// ── Floating call button (mobile) ─────────────────────────
(function () {
  const fab = document.createElement("a");
  fab.className = "call-fab";
  fab.href = "tel:+380679635755";
  fab.setAttribute("aria-label", "Зателефонувати нотаріусу");
  fab.innerHTML =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
    "<span>Подзвонити</span>";
  document.body.appendChild(fab);
})();

const mainNav = document.getElementById("main-nav");
const burger = document.getElementById("burger");
const searchModal = document.getElementById("search-modal");
const searchOpenBtn = document.getElementById("open-search");
const searchCloseBtn = document.getElementById("close-search");
const searchInput = document.getElementById("site-search-input");
const searchResults = document.getElementById("search-results");

function closeMenu() {
  mainNav.classList.remove("open");
  burger.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
}

burger.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  burger.classList.toggle("open", isOpen);
  burger.setAttribute("aria-expanded", String(isOpen));
});

(function setActiveNav() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach(link => {
    const href = link.getAttribute("href") || "";
    const linkFile = href.split("/").pop();
    const active = linkFile === file;
    link.classList.toggle("active", active);
    link.setAttribute("aria-current", active ? "page" : "false");
  });
})();

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add("visible"), index * 100);
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => revealObs.observe(el));

function clearSearchHighlights() {
  const parents = new Set();
  document.querySelectorAll("mark.search-hit").forEach(mark => {
    if (mark.parentNode) parents.add(mark.parentNode);
    mark.replaceWith(document.createTextNode(mark.textContent));
  });
  parents.forEach(p => p.normalize());
}

function highlightInElement(root, query) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  const q = query.toLowerCase();

  while (walker.nextNode()) {
    const n = walker.currentNode;
    const tag = n.parentElement ? n.parentElement.tagName : "";
    if (!n.nodeValue || !n.nodeValue.trim()) continue;
    if (["SCRIPT", "STYLE", "MARK"].includes(tag)) continue;
    nodes.push(n);
  }

  const matches = [];

  nodes.forEach(n => {
    const orig = n.nodeValue;
    const lower = orig.toLowerCase();
    let from = 0;
    let idx = lower.indexOf(q, from);
    if (idx === -1) return;

    const frag = document.createDocumentFragment();
    while (idx !== -1) {
      if (idx > from) frag.appendChild(document.createTextNode(orig.slice(from, idx)));
      const mark = document.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = orig.slice(idx, idx + q.length);
      frag.appendChild(mark);
      matches.push(mark);
      from = idx + q.length;
      idx = lower.indexOf(q, from);
    }
    if (from < orig.length) frag.appendChild(document.createTextNode(orig.slice(from)));
    n.parentNode.replaceChild(frag, n);
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

  const main = document.querySelector("main");
  const matches = highlightInElement(main, trimmed);

  if (!matches.length) {
    searchResults.innerHTML = `<p class="search-empty">За запитом "${trimmed}" нічого не знайдено.</p>`;
    return;
  }

  searchResults.innerHTML = `
    <button class="search-result" type="button" id="go-first-match">
      <span class="search-result-title">Перейти до першого збігу</span>
      <span class="search-result-meta">Збігів на сторінці: ${matches.length}</span>
    </button>
  `;

  document.getElementById("go-first-match").addEventListener("click", () => {
    closeSearch();
    matches[0].scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

searchOpenBtn.addEventListener("click", openSearch);
searchCloseBtn.addEventListener("click", closeSearch);
searchModal.addEventListener("click", e => {
  if (e.target === searchModal) closeSearch();
});
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && searchModal.classList.contains("open")) closeSearch();
});
searchInput.addEventListener("input", e => renderSearchResults(e.target.value));

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
    photos.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `photo-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("aria-label", `Показати слайд ${i + 1}`);
      dot.addEventListener("click", () => {
        current = i;
        render();
        resetTimer();
      });
      nav.appendChild(dot);
    });
  }

  function render() {
    const len = photos.length;
    photos.forEach((photo, i) => {
      const offset = (i - current + len) % len;
      photo.style.zIndex = String(len - offset);
      photo.style.opacity = offset === 0 ? "1" : offset === 1 ? "0.7" : offset === 2 ? "0.4" : "0";
      photo.style.transform = offset === 0
        ? "translateY(0) scale(1)"
        : offset === 1
          ? "translateY(14px) scale(0.97)"
          : offset === 2
            ? "translateY(26px) scale(0.94)"
            : "translateY(38px) scale(0.91)";
    });
    nav.querySelectorAll(".photo-dot").forEach((dot, i) => dot.classList.toggle("active", i === current));
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

  stack.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
  });

  stack.addEventListener("touchend", e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) <= 40) return;
    current = dx < 0
      ? (current + 1) % photos.length
      : (current - 1 + photos.length) % photos.length;
    render();
    resetTimer();
  });
}

initStackCarousel("photo-stack", "photo-nav");

// ── Contact Form ─────────────────────────────────────────────
const WORKER_URL = 'https://notsem-form.skoary2000.workers.dev/';

(function () {
  function isValidContact(value) {
    var s = value.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return true; // email
    var digits = s.replace(/\D/g, '');
    if (/^[+\d][\d\s().-]+$/.test(s) && digits.length >= 9 && digits.length <= 15) return true; // phone
    return false;
  }

  function clearFormNote(form) {
    var note = form.querySelector(".form-error-note");
    if (note) note.remove();
  }

  function showFormNote(form, html) {
    clearFormNote(form);
    var note = document.createElement("p");
    note.className = "form-error-note";
    note.setAttribute("role", "alert");
    note.innerHTML = html;
    var btn = form.querySelector("[type='submit']");
    btn.insertAdjacentElement("afterend", note);
  }

  function showSuccess(form) {
    var wrap = form.closest(".contact-form-wrap");
    if (wrap) {
      form.hidden = true;
      var success = wrap.querySelector(".contact-success");
      if (success) success.hidden = false;
    }
  }

  document.querySelectorAll(".contact-form").forEach(function (form) {
    form.querySelectorAll(".form-input").forEach(function (input) {
      input.addEventListener("input", function () {
        input.classList.remove("form-input-error");
        clearFormNote(form);
      });
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      var nameEl    = form.querySelector("[name='name']");
      var contactEl = form.querySelector("[name='contact']");
      var hpEl      = form.querySelector("[name='website']");
      var valid = true;

      if (nameEl && !nameEl.value.trim()) {
        nameEl.classList.add("form-input-error");
        valid = false;
      }
      if (contactEl && !isValidContact(contactEl.value)) {
        contactEl.classList.add("form-input-error");
        valid = false;
      }
      if (!valid) {
        showFormNote(form, "Вкажіть, будь ласка, ім'я та коректний телефон або email.");
        return;
      }

      // Honeypot: реальні користувачі не бачать це поле; якщо заповнене — це бот.
      if (hpEl && hpEl.value) {
        showSuccess(form);
        return;
      }

      var btn = form.querySelector("[type='submit']");
      var originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Надсилаємо...';
      clearFormNote(form);

      var data = {
        name:    nameEl ? nameEl.value.trim() : '',
        contact: contactEl ? contactEl.value.trim() : '',
        service: (form.querySelector("[name='service']") || {}).value || 'не вказано',
        comment: (form.querySelector("[name='comment']") || {}).value.trim() || '',
      };

      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 12000);

      try {
        var res = await fetch(WORKER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) throw new Error('server error');

        showSuccess(form);
        form.reset();

      } catch (_) {
        clearTimeout(timeout);
        btn.disabled = false;
        btn.textContent = originalText;
        showFormNote(form, 'Не вдалося надіслати заявку. Зателефонуйте, будь ласка: <a href="tel:+380679635755">+380 (67) 963 57 55</a>');
      }
    });
  });
})();

// ── Page Transitions ─────────────────────────────────────────
(function () {
  const PRM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION = 200;

  document.addEventListener("click", function (e) {
    if (PRM) return;
    const link = e.target.closest("a[href]");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href) return;
    if (link.target === "_blank") return;
    if (/^(#|https?:|\/\/|tel:|mailto:)/.test(href)) return;
    e.preventDefault();
    closeMenu();
    document.body.classList.add("is-leaving");
    setTimeout(function () { window.location.href = href; }, DURATION);
  });
})();

// ── Service Content from CSV ────────────────────────────────
(function () {
  const main = document.querySelector('main[data-category]');
  if (!main) return;

  const category = main.dataset.category;
  const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKuKnSlDLyBCKWkgtI5m2cilIKBQ1y14gZKGlERN2Oz4FJob2Dk2sUkeej08e0Y5IvTfiDCHkIVxL5/pub?output=csv';

  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuote = false, i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (inQuote) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
        if (ch === '"') { inQuote = false; i++; continue; }
        field += ch;
      } else {
        if (ch === '"') { inQuote = true; i++; continue; }
        if (ch === ',') { row.push(field); field = ''; i++; continue; }
        if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
        if (ch === '\r') { i++; continue; }
        field += ch;
      }
      i++;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  fetch(CSV_URL)
    .then(function (r) { return r.text(); })
    .then(function (text) {
      var rows = parseCSV(text);
      if (rows[0] && rows[0][0].trim().toLowerCase() === 'category') rows = rows.slice(1);
      var match = rows.find(function (r) { return r[0] && r[0].trim() === category; });
      if (!match) return;

      function fill(id, val) {
        var el = document.getElementById(id);
        if (el && val) el.innerHTML = val.trim().replace(/\n/g, '<br>');
      }

      fill('info-for-that', match[1]);
      fill('info-price', match[2]);
      fill('info-documents', match[3]);
    })
    .catch(function () {});
})();

// ── Stats accordion ─────────────────────────────────────────
(function () {
  const cards = document.querySelectorAll(".stat-card[data-panel]");
  if (!cards.length) return;

  function closeAll() {
    cards.forEach(c => {
      c.classList.remove("active");
      c.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".stat-panel-wrap").forEach(p => p.classList.remove("open"));
  }

  cards.forEach(card => {
    card.addEventListener("click", () => {
      const isOpen = card.classList.contains("active");
      closeAll();
      if (!isOpen) {
        card.classList.add("active");
        card.setAttribute("aria-expanded", "true");
        const panel = document.getElementById("panel-" + card.dataset.panel);
        if (panel) panel.classList.add("open");
      }
    });
  });
})();
