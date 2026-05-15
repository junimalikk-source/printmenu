// =========================================================
// Cheapestprint.co.uk — script.js
// Sections:
//   1. nav        (Task 5)
//   2. pricing    (Task 10)
//   3. lightbox   (Task 13)
//   4. form       (Task 17)
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

// 5. boot ------------------------------------------------
function boot() {
  initNav();
  initPricing();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
