/* ── CATALOG JS ── Filters, sort, esencia bars, fade-in ── */

document.addEventListener('DOMContentLoaded', () => {

  // ── ESENCIA BARS ANIMATION ─────────────────────────────
  const observerOptions = { threshold: 0.1 };
  const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('.esencia-bar-fill').forEach(bar => {
          bar.classList.add('animated');
        });
        barObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.esencia-section').forEach(el => barObserver.observe(el));

  // ── SCROLL FADE IN ─────────────────────────────────────
  const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05 });

  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  // ── PROMOTIONS CAROUSEL ────────────────────────────────
  const track = document.querySelector('.promo-track');
  if (track) {
    const cards = track.querySelectorAll('.promo-card');
    const dots = document.querySelectorAll('.carousel-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    let current = 0;
    let visible = getVisibleCount();
    let autoTimer;

    function getVisibleCount() {
      if (window.innerWidth < 600) return 1;
      if (window.innerWidth < 900) return 2;
      return Math.min(3, cards.length);
    }

    function goTo(idx) {
      const max = Math.max(0, cards.length - visible);
      current = Math.max(0, Math.min(idx, max));
      const cardW = cards[0]?.offsetWidth + 20 || 0;
      track.style.transform = `translateX(-${current * cardW}px)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function startAuto() {
      autoTimer = setInterval(() => {
        const max = Math.max(0, cards.length - visible);
        goTo(current >= max ? 0 : current + 1);
      }, 4000);
    }

    function stopAuto() { clearInterval(autoTimer); }

    prevBtn?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    nextBtn?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));

    window.addEventListener('resize', () => {
      visible = getVisibleCount();
      goTo(current);
    });

    goTo(0);
    if (cards.length > visible) startAuto();
  }

  // ── FEATURED BANNER CAROUSEL ───────────────────────────
  const bannerCarousel = document.getElementById('featured-banner-carousel');
  if (bannerCarousel) {
    const slides = bannerCarousel.querySelectorAll('.banner-slide');
    const dots = document.querySelectorAll('.banner-dot');
    let currentBanner = 0;
    let bannerTimer;

    function goBanner(idx) {
      if (slides.length <= 1) return;
      currentBanner = (idx + slides.length) % slides.length;
      bannerCarousel.style.transform = `translateX(-${currentBanner * 100}%)`;
      dots.forEach((d, i) => d.classList.toggle('active', i === currentBanner));
    }

    function startBannerAuto() {
      if (slides.length <= 1) return;
      bannerTimer = setInterval(() => goBanner(currentBanner + 1), 6000);
    }

    function stopBannerAuto() {
      clearInterval(bannerTimer);
    }

    dots.forEach((d, i) => d.addEventListener('click', () => {
      stopBannerAuto();
      goBanner(i);
      startBannerAuto();
    }));

    if (slides.length > 1) {
      startBannerAuto();
    }
  }

  // ── GALLERY ────────────────────────────────────────────
  const galleryMain = document.getElementById('gallery-main-img');
  if (galleryMain) {
    document.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        galleryMain.src = thumb.dataset.src;
      });
    });
  }

  // ── CATEGORY FILTER (submit form on click) ─────────────
  document.querySelectorAll('[data-cat-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const form = document.getElementById('filter-form');
      if (!form) return;
      form.querySelector('[name="category"]').value = btn.dataset.catFilter;
      form.submit();
    });
  });

  // ── SORT ───────────────────────────────────────────────
  document.getElementById('sort-select')?.addEventListener('change', function () {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    const cards = [...grid.querySelectorAll('.product-card[data-rating][data-price][data-name]')];
    cards.sort((a, b) => {
      switch (this.value) {
        case 'rating': return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
        case 'price_asc': return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        case 'price_desc': return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        case 'name': return a.dataset.name.localeCompare(b.dataset.name);
        default: return 0;
      }
    });
    cards.forEach(c => grid.appendChild(c));
  });

  // ── CLIENT-SIDE SEARCH HIGHLIGHT ───────────────────────
  const searchInput = document.querySelector('.header-search input');
  const filterForm = document.getElementById('filter-form');
  if (searchInput && filterForm) {
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => filterForm.submit(), 500);
    });
  }
});
