// assets/checkout.js — wires .pt-cell clicks to Stripe Checkout via
// /api/create-checkout-session. Replaces the previous quote-prefill handler.
import { selectionsFromCell } from '/script.js';

(function () {
  const PHONE = '07488 279811';

  function ensureStatusRegion() {
    let el = document.getElementById('checkout-status');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'checkout-status';
    el.className = 'checkout-status';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    const host = document.querySelector('#pricing .container') || document.body;
    host.appendChild(el);
    return el;
  }

  async function startCheckout(cell) {
    if (cell.getAttribute('aria-busy') === 'true') return;
    const selections = selectionsFromCell(cell);
    if (!selections) return;
    const { size, qty } = selections;

    const status = ensureStatusRegion();
    cell.setAttribute('aria-busy', 'true');
    status.textContent = 'Preparing checkout…';

    try {
      const attempt_id = crypto.randomUUID();
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ size, qty, attempt_id }),
      });
      if (!res.ok) throw new Error('checkout-failed');
      const { url } = await res.json();
      // Defence-in-depth: reject anything that isn't a Stripe HTTPS URL.
      if (typeof url !== 'string' || !/^https:\/\/checkout\.stripe\.com\//.test(url)) {
        throw new Error('bad-url');
      }
      window.location.assign(url);
    } catch {
      cell.setAttribute('aria-busy', 'false');
      status.textContent =
        `Could not start checkout — please try again or call us on ${PHONE}.`;
    }
  }

  function init() {
    const cells = document.querySelectorAll('.pt-cell[data-size][data-qty]');
    cells.forEach(cell => {
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      cell.addEventListener('click', () => startCheckout(cell));
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startCheckout(cell);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();