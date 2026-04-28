function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const t = document.getElementById('page-' + name);
    if (t) { t.classList.add('active'); window.scrollTo(0,0); }
    document.getElementById('main-nav').classList.remove('open');
    setTimeout(initReveal, 50);
  }

  function toggleMenu() { document.getElementById('main-nav').classList.toggle('open'); }

  function clearSearchHighlights() {
    document.querySelectorAll('mark.search-hit').forEach((m) => {
      const text = document.createTextNode(m.textContent);
      m.replaceWith(text);
    });
  }

  function highlightInElement(root, query) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      if (node.parentElement && ['SCRIPT', 'STYLE', 'MARK'].includes(node.parentElement.tagName)) continue;
      textNodes.push(node);
    }

    const matches = [];
    textNodes.forEach((node) => {
      const text = node.nodeValue;
      const lower = text.toLowerCase();
      const q = query.toLowerCase();
      let from = 0;
      let idx = lower.indexOf(q, from);
      if (idx === -1) return;

      const frag = document.createDocumentFragment();
      while (idx !== -1) {
        if (idx > from) frag.appendChild(document.createTextNode(text.slice(from, idx)));
        const mark = document.createElement('mark');
        mark.className = 'search-hit';
        mark.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(mark);
        matches.push(mark);
        from = idx + q.length;
        idx = lower.indexOf(q, from);
      }
      if (from < text.length) frag.appendChild(document.createTextNode(text.slice(from)));
      node.parentNode.replaceChild(frag, node);
    });

    return matches;
  }

  function runSiteSearch() {
    const q = prompt('Що знайти на сайті?');
    if (!q) return;
    const query = q.trim().toLowerCase();
    if (!query) return;

    clearSearchHighlights();

    const pages = Array.from(document.querySelectorAll('.page'));
    for (const page of pages) {
      const matches = highlightInElement(page, query);
      if (matches.length) {
        const name = page.id.replace('page-', '');
        showPage(name);
        const title = page.querySelector('h1, h2')?.innerText || 'Знайдено';
        matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        alert('Знайдено на сторінці: ' + title + ' (збігів: ' + matches.length + ')');
        return;
      }
    }

    alert('Нічого не знайдено за запитом: ' + q);
  }

  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 100);
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });

  function initReveal() {
    document.querySelectorAll('.page.active .reveal').forEach(el => {
      if (!el.classList.contains('visible')) revealObs.observe(el);
    });
  }
  initReveal();

  function initStackCarousel(stackId, navId) {
    const stack = document.getElementById(stackId);
    const navEl = document.getElementById(navId);
    if (!stack || !navEl) return;

    const photos = Array.from(stack.querySelectorAll('.stack-photo'));
    if (!photos.length) return;

    let current = 0;
    let autoTimer;
    let touchX = 0;

    function buildNav() {
      navEl.innerHTML = '';
      photos.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'photo-dot' + (i === 0 ? ' active' : '');
        d.onclick = () => goTo(i);
        navEl.appendChild(d);
      });
    }

    function renderStack() {
      const n = photos.length;
      photos.forEach((p, i) => {
        const off = (i - current + n) % n;
        p.style.zIndex = n - off;
        p.style.opacity = off === 0 ? '1' : off === 1 ? '0.7' : off === 2 ? '0.4' : '0';
        p.style.transform = off === 0 ? 'translateY(0) scale(1)' :
                            off === 1 ? 'translateY(14px) scale(0.97)' :
                            off === 2 ? 'translateY(26px) scale(0.94)' :
                                        'translateY(38px) scale(0.91)';
      });
      navEl.querySelectorAll('.photo-dot').forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(i) { current = i; renderStack(); resetAuto(); }
    function nextPhoto() { current = (current + 1) % photos.length; renderStack(); }
    function resetAuto() { clearInterval(autoTimer); autoTimer = setInterval(nextPhoto, 3500); }

    buildNav();
    renderStack();
    resetAuto();

    stack.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; });
    stack.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 40) {
        current = dx < 0 ? (current + 1) % photos.length : (current - 1 + photos.length) % photos.length;
        renderStack();
        resetAuto();
      }
    });
  }

  initStackCarousel('photo-stack', 'photo-nav');
  initStackCarousel('reviews-stack', 'reviews-nav');

