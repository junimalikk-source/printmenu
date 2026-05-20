// assets/success.js — confirms payment with /api/checkout-status, then
// reveals artwork-email UI. No-op if session_id missing or unpaid.
(async function () {
  const checking = document.getElementById('success-checking');
  const paid = document.getElementById('success-paid');
  const fallback = document.getElementById('success-fallback');

  function show(section) {
    [checking, paid, fallback].forEach(s => { if (s) s.hidden = (s !== section); });
  }

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('session_id');
  if (!sessionId) { show(fallback); return; }

  let data;
  try {
    const res = await fetch(`/api/checkout-status?session_id=${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) { show(fallback); return; }
    data = await res.json();
  } catch {
    show(fallback);
    return;
  }

  if (data.payment_status !== 'paid') { show(fallback); return; }

  const orderRef = data.order_ref;
  document.getElementById('order-ref').textContent = orderRef;
  document.getElementById('order-ref-plain').textContent = orderRef;

  // Build a mailto: with short, percent-encoded subject + body.
  const subject = `Artwork for order ${orderRef}`;
  const body =
    `Order ref: ${orderRef}\n` +
    `Restaurant name: ${data.restaurant_name || ''}\n` +
    `Notes:\n`;
  const mailto = `mailto:hello@printmenu.co.uk?` +
    new URLSearchParams({ subject, body }).toString();
  document.getElementById('email-artwork').setAttribute('href', mailto);

  // Copy-to-clipboard for the order ref.
  const copyBtn = document.getElementById('copy-ref');
  if (copyBtn && navigator.clipboard) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(orderRef);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'Copied ✓';
        setTimeout(() => { copyBtn.textContent = original; }, 1500);
      } catch { /* ignore */ }
    });
  } else if (copyBtn) {
    copyBtn.hidden = true;
  }

  show(paid);
})();
