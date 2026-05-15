// =========================================================
// Cheapestprint.co.uk — script.js
// Sections:
//   1. nav        (Task 5)
//   2. pricing    (Task 10)
//   3. lightbox   (Task 13)
//   4. form       (Tasks 16–17)
//   5. boot
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
    document.body.style.overflow = open ? 'hidden' : '';
  };

  burger.addEventListener('click', () => setOpen(overlay.hidden));
  overlay.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') setOpen(false);
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

function applyPrefill({ size, qty }) {
  const sizeSel = document.querySelector('#quote select[name="size"]');
  const qtySel  = document.querySelector('#quote select[name="quantity"]');
  if (sizeSel) sizeSel.value = size;
  if (qtySel) qtySel.value = qty;
}

function initPricing() {
  const cells = document.querySelectorAll('#pricing .pt-cell');
  cells.forEach((cell) => {
    cell.setAttribute('tabindex', '0');
    cell.setAttribute('role', 'button');
    cell.setAttribute('aria-label',
      `Get a quote for ${cell.dataset.qty} ${cell.dataset.size} menus`);
    const handler = () => {
      const sel = selectionsFromCell(cell);
      if (!sel) return;
      applyPrefill(sel);
      document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
    };
    cell.addEventListener('click', handler);
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });
  });
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

  document.querySelectorAll('#gallery .gallery-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      open(btn.dataset.src, btn.dataset.caption);
    });
  });

  closeBtn.addEventListener('click', close);
  lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.hidden && e.key === 'Escape') close();
  });
}

// 4. form ----------------------------------------------------
export function isUKPhone(input) {
  if (typeof input !== 'string') return false;
  const digits = input.replace(/[^\d]/g, '');
  // Accept: 10 digits starting 0 (UK national), 11 digits starting 0,
  // 11 digits starting 44 (international), 12 digits starting 0044.
  if (/^0\d{9,10}$/.test(digits)) return true;
  if (/^44\d{9,10}$/.test(digits)) return true;
  if (/^0044\d{9,10}$/.test(digits)) return true;
  return false;
}

// 5. boot ------------------------------------------------
function boot() {
  initNav();
  initPricing();
  initLightbox();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
