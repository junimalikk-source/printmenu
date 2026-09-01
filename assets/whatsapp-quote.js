// assets/whatsapp-quote.js — DOM wiring for /admin/whatsapp-quote.html.
// All message logic lives in assets/whatsapp-templates.js (unit tested);
// this file only reads the form, renders the preview and builds the link.
import {
  TEMPLATES,
  TONES,
  SKUS,
  DEFAULT_SPEC,
  PAYMENT_LINK,
  renderMessage,
  buildWhatsAppUrl,
  normaliseWhatsAppNumber,
  formatAmount,
  // ?v= because /assets/* is served `immutable` for a year (see _headers) —
  // bump this and the <script src> in admin/whatsapp-quote.html together.
} from '/assets/whatsapp-templates.js?v=1';

const $ = (id) => document.getElementById(id);

const el = {
  form: $('wq-form'),
  template: $('wq-template'),
  tone: $('wq-tone'),
  name: $('wq-name'),
  phone: $('wq-phone'),
  phoneHint: $('wq-phone-hint'),
  sku: $('wq-sku'),
  item: $('wq-item'),
  amount: $('wq-amount'),
  spec: $('wq-spec'),
  finish: $('wq-finish'),
  delivery: $('wq-delivery'),
  proofTurnaround: $('wq-proof-turnaround'),
  deliveryDays: $('wq-delivery-days'),
  proofBy: $('wq-proof-by'),
  paymentLink: $('wq-payment-link'),
  preview: $('wq-preview'),
  missing: $('wq-missing'),
  open: $('wq-open'),
  copy: $('wq-copy'),
  copyLink: $('wq-copy-link'),
  status: $('wq-status'),
  url: $('wq-url'),
};

const FIELD_LABELS = {
  name: 'customer name',
  item: 'item',
  amount: 'total',
  proofBy: 'proof by',
};

function option(value, label) {
  const o = document.createElement('option');
  o.value = value;
  o.textContent = label;
  return o;
}

function populate() {
  TEMPLATES.forEach((t) => el.template.append(option(t.id, t.label)));
  Object.entries(TONES).forEach(([id, t]) => el.tone.append(option(id, t.label)));

  el.sku.append(option('', 'Custom — type it below'));
  SKUS.forEach((s) => {
    const price = formatAmount(s.amount_pence / 100);
    el.sku.append(option(s.sku, `${s.item} — £${price}`));
  });

  el.spec.value = DEFAULT_SPEC;
  el.paymentLink.value = PAYMENT_LINK;
}

/** Show only the fields the selected template actually uses. */
function applyTemplateVisibility() {
  const current = el.template.value;
  el.form.querySelectorAll('[data-for]').forEach((field) => {
    field.hidden = !field.dataset.for.split(' ').includes(current);
  });
}

function currentFields() {
  return {
    tone: el.tone.value,
    name: el.name.value,
    item: el.item.value,
    amount: el.amount.value,
    spec: el.spec.value,
    finish: el.finish.value,
    delivery: el.delivery.value,
    proofTurnaround: el.proofTurnaround.value,
    deliveryDays: el.deliveryDays.value,
    proofBy: el.proofBy.value,
    paymentLink: el.paymentLink.value,
  };
}

let state = { text: '', url: 'https://wa.me/', ready: false };

function update() {
  const { text, missing } = renderMessage(el.template.value, currentFields());
  const url = buildWhatsAppUrl({ phone: el.phone.value, message: text });
  state = { text, url, ready: missing.length === 0 };

  el.preview.textContent = text;
  el.url.textContent = url;
  el.open.href = url;
  el.open.setAttribute('aria-disabled', String(!state.ready));
  el.open.classList.toggle('is-disabled', !state.ready);

  if (missing.length) {
    el.missing.hidden = false;
    el.missing.textContent =
      `Still needed: ${missing.map((k) => FIELD_LABELS[k] || k).join(', ')}.`;
  } else {
    el.missing.hidden = true;
    el.missing.textContent = '';
  }

  const number = normaliseWhatsAppNumber(el.phone.value);
  if (!el.phone.value.trim()) {
    el.phoneHint.textContent = 'Leave blank to pick the contact inside WhatsApp.';
  } else if (number) {
    el.phoneHint.textContent = `Sending to +${number}.`;
  } else {
    el.phoneHint.textContent = "That doesn't look like a phone number — WhatsApp will ask you to pick the contact.";
  }
}

async function copy(value, label) {
  try {
    await navigator.clipboard.writeText(value);
    el.status.textContent = `${label} copied.`;
  } catch {
    el.status.textContent = `Couldn't copy automatically — select the ${label.toLowerCase()} and copy it by hand.`;
  }
}

function init() {
  populate();
  applyTemplateVisibility();

  el.template.addEventListener('change', () => {
    applyTemplateVisibility();
    update();
  });

  el.sku.addEventListener('change', () => {
    const match = SKUS.find((s) => s.sku === el.sku.value);
    if (!match) return;
    el.item.value = match.item;
    el.amount.value = String(match.amount_pence / 100);
    update();
  });

  el.form.addEventListener('input', update);
  el.form.addEventListener('submit', (e) => e.preventDefault());

  el.copy.addEventListener('click', () => copy(state.text, 'Message'));
  el.copyLink.addEventListener('click', () => copy(state.url, 'Link'));

  el.open.addEventListener('click', (e) => {
    // The link is a real <a> so it opens natively when the quote is complete;
    // block it only while required fields are still empty.
    if (!state.ready) {
      e.preventDefault();
      el.status.textContent = 'Fill in the highlighted fields before sending.';
    }
  });

  update();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
