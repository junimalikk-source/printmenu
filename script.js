// =========================================================
// Cheapestprint.co.uk — script.js
// Sections:
//   1. nav        (Task 5)
//   2. pricing    (Task 10)
//   3. lightbox   (Task 13)
//   4. form       (Tasks 16–17)
//   5. gallery effects (3D tilt + scroll entrance)
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

function initForm() {
  const form = document.getElementById('quote-form');
  if (!form) return;
  const status = form.querySelector('.qf-status');
  const phoneInput = form.querySelector('#qf-phone');
  const honey = form.querySelector('[name="company_website"]');

  const setStatus = (text, kind) => {
    status.textContent = text;
    status.hidden = false;
    status.classList.remove('is-success', 'is-error');
    if (kind) status.classList.add(`is-${kind}`);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot: pretend success, send nothing.
    if (honey && honey.value.trim() !== '') {
      setStatus("Thanks, we'll be in touch within 1 working hour.", 'success');
      form.reset();
      return;
    }

    // Native validation first
    if (!form.checkValidity()) {
      setStatus('Please fill in your name, phone, size and quantity.', 'error');
      form.reportValidity();
      return;
    }

    if (!isUKPhone(phoneInput.value)) {
      setStatus('Please enter a valid UK phone number.', 'error');
      phoneInput.focus();
      return;
    }

    setStatus('Sending…', null);

    try {
      const action = form.getAttribute('action') || '';
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("Thanks, we'll be in touch within 1 working hour. For urgent quotes call 01274 305555.", 'success');
      form.reset();
    } catch (err) {
      setStatus('Something went wrong. Please call us on 01274 305555 — sorry about that.', 'error');
    }
  });
}

// 5. gallery effects ----------------------------------------
function initGalleryEffects() {
  const gallery = document.getElementById('gallery');
  const items = gallery ? Array.from(gallery.querySelectorAll('.gallery-item')) : [];
  if (!items.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Scroll-into-view entrance with staggered delay
  gallery.classList.add('gallery-anim-ready');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach((item, idx) => {
    item.style.transitionDelay = (idx * 70) + 'ms';
    io.observe(item);
  });

  // Mouse-follow tilt — desktop with a fine pointer only
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  items.forEach((item) => {
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
function boot() {
  initNav();
  initPricing();
  initLightbox();
  initForm();
  initGalleryEffects();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
