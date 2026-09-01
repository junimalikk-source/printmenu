// assets/whatsapp-templates.js
// Pure helpers for turning a quote into a ready-to-send WhatsApp message and
// a wa.me deep link. No DOM access — assets/whatsapp-quote.js does the wiring,
// tests/unit/whatsapp-templates.test.js covers the logic.
//
// The message copy is the canonical version of docs/whatsapp-quote-templates.md.
// Change it here and update that doc, not the other way round.

export const BRAND = 'PrintMenu.co.uk';

// Viva Wallet hosted page — the customer types the agreed amount at checkout,
// which is why every template also states the £ total in the message body.
export const PAYMENT_LINK = 'https://pay.vivawallet.com/printplus-uk-ltd';

// Standard sale SKUs, offered as a quick-fill in the generator so the common
// case is two clicks. Mirrors functions/lib/pricing.js — a drift test in
// tests/unit/whatsapp-templates.test.js fails if the two ever disagree.
export const SKUS = [
  { sku: 'A5-10K',   amount_pence:  20000, item: '10,000 × A5 menus'   },
  { sku: 'A5-20K',   amount_pence:  30000, item: '20,000 × A5 menus'   },
  { sku: 'A5-40K',   amount_pence:  45000, item: '40,000 × A5 menus'   },
  { sku: 'A5-100K',  amount_pence:  90000, item: '100,000 × A5 menus'  },
  { sku: 'A4-10K',   amount_pence:  42500, item: '10,000 × A4 menus'   },
  { sku: 'A4-20K',   amount_pence:  55000, item: '20,000 × A4 menus'   },
  { sku: 'A4-40K',   amount_pence:  90000, item: '40,000 × A4 menus'   },
  { sku: 'A4-100K',  amount_pence: 160000, item: '100,000 × A4 menus'  },
  { sku: 'A4+-10K',  amount_pence:  47500, item: '10,000 × A4+ menus'  },
  { sku: 'A4+-20K',  amount_pence:  75000, item: '20,000 × A4+ menus'  },
  { sku: 'A4+-40K',  amount_pence: 125000, item: '40,000 × A4+ menus'  },
  { sku: 'A4+-100K', amount_pence: 230000, item: '100,000 × A4+ menus' },
  { sku: 'A3-10K',   amount_pence:  52500, item: '10,000 × A3 menus'   },
  { sku: 'A3-20K',   amount_pence:  85000, item: '20,000 × A3 menus'   },
  { sku: 'A3-40K',   amount_pence: 150000, item: '40,000 × A3 menus'   },
  { sku: 'A3-100K',  amount_pence: 300000, item: '100,000 × A3 menus'  },
];

export const DEFAULT_SPEC = 'double-sided, full colour, 130gsm gloss';
export const DEFAULT_PROOF_TURNAROUND = '24–48 hrs';
export const DEFAULT_DELIVERY_DAYS = '3–5';

// Tone variants apply to the full quote only — that is the only template with
// a distinct opener and closer to swap (docs/whatsapp-quote-templates.md §4).
export const TONES = {
  standard: {
    label: 'Standard',
    opener: (name) => `Hi ${name}, thanks for your order! Here's your quote:`,
    closer: `Any questions, just reply here. Thanks!\n— ${BRAND}`,
  },
  formal: {
    label: 'More formal',
    opener: (name) => `Dear ${name}, thank you for your enquiry. Please find your quote below:`,
    closer: `Kind regards, ${BRAND}`,
  },
  casual: {
    label: 'More casual',
    opener: (name) => `Hey ${name}! 🙌 Here's the quote for your order:`,
    closer: `Cheers — ${BRAND} 🚀`,
  },
};

export const TEMPLATES = [
  { id: 'full',    label: 'Full quote (new customer)', tones: true  },
  { id: 'short',   label: 'Short quote (repeat customer)', tones: false },
  { id: 'reorder', label: 'Reorder (same as last time)', tones: false },
  { id: 'paid',    label: 'Payment received follow-up', tones: false },
];

/**
 * Format a £ amount for the message body: thousands separated, pence only when
 * they are non-zero. 450 -> "450", 1250.5 -> "1,250.50".
 * Returns '' for anything that isn't a finite non-negative number.
 */
export function formatAmount(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[£,\s]/g, ''));
  if (!Number.isFinite(n) || n < 0) return '';
  const rounded = Math.round(n * 100) / 100;
  const decimals = Number.isInteger(rounded) ? 0 : 2;
  return rounded.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Normalise a customer number to the bare international digits wa.me expects
 * (country code, no '+', no spaces). UK-first, because every customer is UK:
 *
 *   07488 279811    -> 447488279811
 *   +44 7488 279811 -> 447488279811
 *   +44 (0)7488 279811 -> 447488279811
 *   0044 7488279811 -> 447488279811
 *   7488279811      -> 447488279811   (10 digits starting 7 = UK mobile)
 *   353871234567    -> 353871234567   (already international, left alone)
 *
 * Returns null when the input can't be a phone number, so callers can fall
 * back to a contact-picker wa.me link instead of building a broken one.
 */
export function normaliseWhatsAppNumber(input) {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  let digits = String(input).trim();

  const hadPlus = digits.startsWith('+');
  digits = digits.replace(/\D/g, '');
  if (!digits) return null;

  if (!hadPlus && digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    // UK national format — swap the trunk 0 for the country code.
    digits = '44' + digits.replace(/^0+/, '');
  } else if (!hadPlus && digits.length === 10 && digits.startsWith('7')) {
    // A UK mobile typed without its leading 0.
    digits = '44' + digits;
  }

  // "+44 (0)7488 279811" — the bracketed trunk 0 survives the strip above.
  if (digits.startsWith('440')) digits = '44' + digits.slice(3).replace(/^0+/, '');

  // E.164: country code + subscriber number, 8–15 digits all in.
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

const bullet = (label, value) => (value ? `• ${label}: ${value}\n` : '');

function renderFull(f) {
  const tone = TONES[f.tone] || TONES.standard;
  const summary =
    bullet('Item', f.item) +
    bullet('Spec', f.spec) +
    bullet('Finish', f.finish) +
    bullet('Delivery', f.delivery);

  return [
    tone.opener(f.name),
    '',
    '📋 ORDER SUMMARY',
    summary.trimEnd(),
    '',
    `💷 TOTAL: £${f.amount} (incl. VAT, delivery)`,
    '',
    '💳 PAYMENT',
    'Secure payment link:',
    f.paymentLink,
    '',
    '📌 NEXT STEPS',
    `1. Once payment is received, we send your design proof within ${f.proofTurnaround}`,
    '2. You approve the proof (or request changes)',
    `3. We print and dispatch — delivery in ${f.deliveryDays} working days`,
    '',
    'Please note: design work and printing only begin after payment is confirmed.',
    '',
    tone.closer,
  ].join('\n');
}

function renderShort(f) {
  return [
    `Hi ${f.name} 👋`,
    '',
    'Quote for your reorder:',
    `• ${f.item}`,
    `• Total: £${f.amount}`,
    '',
    `Pay here: ${f.paymentLink}`,
    '',
    "Once paid, we'll start the design proof — same turnaround as last time.",
    '',
    'Thanks!',
  ].join('\n');
}

function renderReorder(f) {
  return [
    `Hi ${f.name}, confirming your reorder:`,
    '',
    `• Same as last order: ${f.item}`,
    `• Total: £${f.amount}`,
    '',
    `Pay: ${f.paymentLink}`,
    '',
    'Print starts as soon as payment lands. No new proof needed unless you want changes — just reply if so.',
    '',
    'Cheers!',
  ].join('\n');
}

function renderPaid(f) {
  return [
    `Payment received ✅ Thanks ${f.name}!`,
    '',
    `Your order is now with our design team. We'll send your proof by ${f.proofBy}.`,
  ].join('\n');
}

const RENDERERS = { full: renderFull, short: renderShort, reorder: renderReorder, paid: renderPaid };

/** Fields the given template needs before it produces a sendable message. */
export function requiredFields(templateId) {
  return templateId === 'paid' ? ['name', 'proofBy'] : ['name', 'item', 'amount'];
}

/**
 * Render a template to WhatsApp-ready plain text.
 * Blank optional fields drop their line rather than leaving a [placeholder];
 * blank required fields keep a visible [placeholder] so nothing silently ships
 * half-filled. `missing` lists them so the UI can block the send.
 *
 * @returns {{ text: string, missing: string[] }}
 */
export function renderMessage(templateId, fields = {}) {
  const render = RENDERERS[templateId];
  if (!render) throw new Error(`unknown template: ${templateId}`);

  const missing = requiredFields(templateId).filter((k) =>
    // A total that won't parse ("about four hundred") is as missing as a blank
    // one — it would otherwise ship as a literal "£[amount]".
    k === 'amount' ? !formatAmount(fields.amount) : !String(fields[k] ?? '').trim()
  );
  const placeholder = (key, label) => String(fields[key] ?? '').trim() || `[${label}]`;

  const text = render({
    tone: fields.tone,
    name: placeholder('name', 'Name'),
    item: placeholder('item', 'e.g. 5,000 × A5 menus'),
    spec: String(fields.spec ?? '').trim(),
    finish: String(fields.finish ?? '').trim(),
    delivery: String(fields.delivery ?? '').trim(),
    amount: formatAmount(fields.amount) || '[amount]',
    proofBy: placeholder('proofBy', 'date/time'),
    proofTurnaround: String(fields.proofTurnaround ?? '').trim() || DEFAULT_PROOF_TURNAROUND,
    deliveryDays: String(fields.deliveryDays ?? '').trim() || DEFAULT_DELIVERY_DAYS,
    paymentLink: String(fields.paymentLink ?? '').trim() || PAYMENT_LINK,
  });

  return { text, missing };
}

/**
 * Build the wa.me deep link. With a usable number it opens that customer's
 * chat with the message pre-filled; without one it opens WhatsApp's contact
 * picker carrying the same text.
 */
export function buildWhatsAppUrl({ phone = '', message = '' } = {}) {
  const number = normaliseWhatsAppNumber(phone);
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
