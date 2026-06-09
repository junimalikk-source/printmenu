// =========================================================
// Cheapestprint.co.uk — script.js
// Sections:
//   1. nav
//   2. pricing helper (selectionsFromCell — used by assets/checkout.js)
//   3. lightbox
//   4. form — REMOVED (see comment below)
//   5. gallery effects (marquee loop + 3D mouse-tilt)
//   5b. sale countdown
//   6. boot
// =========================================================

// 1. nav -------------------------------------------------
function initNav() {
  const nav = document.getElementById('top-nav');
  const burger = nav?.querySelector('.nav-hamburger');
  const overlay = document.getElementById('nav-overlay');
  if (!nav || !burger || !overlay) return;

  const setOpen = (open) => {
    overlay.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setOpen(overlay.hidden));
  overlay.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.closest('.nav-overlay-close')) setOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hidden) setOpen(false);
  });

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 50);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// 2. pricing -------------------------------------------------
export function selectionsFromCell(el) {
  if (!el || !el.dataset) return null;
  const { size, qty } = el.dataset;
  if (!size || !qty) return null;
  return { size, qty };
}


// 3. lightbox ------------------------------------------------
function initLightbox() {
  const lb = document.getElementById('lightbox');
  const img = lb?.querySelector('img');
  const cap = lb?.querySelector('figcaption');
  const closeBtn = lb?.querySelector('.lightbox-close');
  if (!lb || !img || !cap || !closeBtn) return;

  let lastFocus = null;

  const open = (src, caption) => {
    lastFocus = document.activeElement;
    img.src = src;
    img.alt = caption || 'Menu image';
    cap.textContent = caption || '';
    lb.hidden = false;
    lb.focus();
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lb.hidden = true;
    img.src = '';
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  };

  // Event delegation so dynamically-cloned marquee items also open the lightbox
  document.getElementById('gallery')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.gallery-item');
    if (btn) open(btn.dataset.src, btn.dataset.caption);
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden && e.key === 'Escape') close();
  });
}

// 4. form — REMOVED. The previous Netlify-bound quote form silently 404'd on
//    Cloudflare Pages (the current host). The quote section is now a static
//    contact panel (#quote in index.html); standard orders go through Stripe
//    Checkout (assets/checkout.js). isUKPhone + initForm both removed.

// 5. gallery effects ----------------------------------------
function initGalleryEffects() {
  const track = document.querySelector('#gallery .gallery-track');
  if (!track) return;

  // Stop the marquee animation for reduced-motion users and automated browsers
  // (the moving target makes click actionability flaky in Playwright).
  const reduce =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    navigator.webdriver === true;

  if (!reduce) {
    // Clone the originals once so the marquee can loop seamlessly.
    // animation translateX(-50%) returns the track to its start position.
    const originals = Array.from(track.children);
    originals.forEach((item) => {
      const clone = item.cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('tabindex', '-1');
      track.appendChild(clone);
    });
  } else {
    track.style.animation = 'none';
  }

  // 3D mouse-follow tilt — desktop with a fine pointer only
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const allItems = Array.from(track.querySelectorAll('.gallery-item'));
  allItems.forEach((item) => {
    let raf = null;
    item.addEventListener('mouseenter', () => item.classList.add('is-tilting'));
    item.addEventListener('mousemove', (e) => {
      const rect = item.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
      const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        item.style.setProperty('--ty', (dx * 9).toFixed(2) + 'deg');
        item.style.setProperty('--tx', (-dy * 9).toFixed(2) + 'deg');
      });
    });
    item.addEventListener('mouseleave', () => {
      item.classList.remove('is-tilting');
      item.style.setProperty('--tx', '0deg');
      item.style.setProperty('--ty', '0deg');
    });
  });
}

// 6. boot ------------------------------------------------
// NOTE: the sale countdown lives inline in index.html so it can never be
// served from a stale cached copy of this file.
function initMenuGallery() {
  const wrap = document.querySelector('.menu-gallery-track-wrap');
  const track = document.querySelector('.menu-gallery-track');
  const prev = document.querySelector('.menu-gallery-arrow--prev');
  const next = document.querySelector('.menu-gallery-arrow--next');
  const dots = Array.from(document.querySelectorAll('.menu-gallery-dot'));
  if (!wrap || !track || !prev || !next) return;

  const slides = Array.from(track.children);
  const total = slides.length;

  const slideStep = () => {
    if (slides.length < 2) return wrap.clientWidth;
    return slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().left;
  };

  prev.addEventListener('click', () => wrap.scrollBy({ left: -slideStep(), behavior: 'smooth' }));
  next.addEventListener('click', () => wrap.scrollBy({ left: slideStep(), behavior: 'smooth' }));

  dots.forEach((d, i) => d.addEventListener('click', () => {
    wrap.scrollTo({ left: i * slideStep(), behavior: 'smooth' });
  }));

  const update = () => {
    const step = slideStep();
    const idx = step > 0 ? Math.round(wrap.scrollLeft / step) : 0;
    dots.forEach((d, i) => d.classList.toggle('is-active', i === Math.min(idx, total - 1)));
    const max = wrap.scrollWidth - wrap.clientWidth - 1;
    prev.disabled = wrap.scrollLeft <= 0;
    next.disabled = wrap.scrollLeft >= max;
  };
  wrap.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  // Lightbox
  const lb = document.getElementById('menu-lb');
  const lbImg = lb?.querySelector('.menu-lb-img');
  const lbClose = lb?.querySelector('.menu-lb-close');
  if (!lb || !lbImg) return;

  let lastFocus = null;
  const openLb = (src, alt) => {
    lastFocus = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lb.hidden = false;
    document.body.style.overflow = 'hidden';
    lbClose?.focus();
  };
  const closeLb = () => {
    lb.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  };

  track.addEventListener('click', (e) => {
    const slide = e.target.closest('.menu-gallery-slide');
    if (!slide) return;
    const img = slide.querySelector('img');
    if (img) openLb(img.src, img.alt);
  });
  lbClose?.addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (!lb.hidden && e.key === 'Escape') closeLb(); });
}


function initCuisineSlider() {
  const wrap = document.querySelector('.cuisine-slider-wrap');
  const prev = document.querySelector('.cuisine-slider-arrow--prev');
  const next = document.querySelector('.cuisine-slider-arrow--next');
  if (!wrap || !prev || !next) return;

  const step = () => Math.round(wrap.clientWidth * 0.8);
  prev.addEventListener('click', () => wrap.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => wrap.scrollBy({ left: step(), behavior: 'smooth' }));

  const update = () => {
    const max = wrap.scrollWidth - wrap.clientWidth - 1;
    prev.disabled = wrap.scrollLeft <= 0;
    next.disabled = wrap.scrollLeft >= max;
  };
  wrap.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function boot() {
  initNav();
  initLightbox();
  initGalleryEffects();
  initCuisineSlider();
  initMenuGallery();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
