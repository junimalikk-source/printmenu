# Stripe Checkout — printmenu.co.uk

**Status:** Spec
**Date:** 2026-05-20
**Authors:** Junaid (decisions), Claude (draft), Codex (peer review — 2 rounds, `model_reasoning_effort=high`, go on round 2)

---

## 1. Goal

Let a customer buy printed takeaway menus directly on `printmenu.co.uk` instead of submitting a quote and waiting for a manual reply. Pay on the site, receive a Stripe receipt, land on a page that tells them to email their artwork to `hello@printmenu.co.uk`. PrintMenu fulfils the design + print as today.

This is a **lead-gen → self-serve** change for the 16 fixed-price SKUs in the pricing matrix. The existing quote form stays in place for custom orders.

---

## 2. Non-goals (v1 scope cuts, deliberate)

- No artwork upload on the site (customer emails it; v1.1 may add R2 upload).
- No order database (Stripe Dashboard is the order system).
- No webhook (Stripe Dashboard + merchant email notifications are the source of truth for paid customers who never return to the success page).
- No custom email templates (Stripe sends receipts; merchant gets dashboard notifications).
- No discount codes / Stripe Coupons (the May sale is baked into the price).
- No partial / split orders, no subscriptions.
- No payment methods beyond cards (no Bacs, Klarna, PayPal in v1).
- No automated chasing of customers who pay but don't email artwork — manual via Stripe Dashboard.

---

## 3. User journey

1. Customer browses pricing matrix in `index.html` (existing).
2. Customer clicks a `.pt-cell` (e.g. £550 = 20K × A4). Today this scrolls to the quote form; new behaviour = trigger checkout.
3. Frontend disables the clicked cell, generates a UUID, POSTs `{ size, qty, attempt_id: uuid }` to `POST /api/create-checkout-session`.
4. Function looks up price server-side, creates Stripe Checkout Session, returns `{ url }`.
5. Frontend redirects via `window.location = url`.
6. Customer pays on Stripe-hosted page. Stripe collects: email, name, UK shipping address, phone, custom field `restaurantname` (required), custom field `notes` (optional).
7. Stripe sends receipt email automatically.
8. Customer lands on `${SITE_URL}/order-success.html?session_id={CHECKOUT_SESSION_ID}`.
9. Success page shows "Checking payment…", calls `GET /api/checkout-status?session_id=...`.
10. Function retrieves session from Stripe, returns `{ payment_status, customer_email, amount_total, order_ref }`.
11. If `payment_status === 'paid'`: page shows order ref, big "Email artwork" button (`mailto:`), plain-text fallback (`hello@printmenu.co.uk` + copyable order ref).
12. If anything else: neutral "We couldn't confirm your payment yet — please email us at hello@printmenu.co.uk and we'll sort it" message.

**Out-of-band ops (manual):** Junaid checks Stripe Dashboard daily for paid orders. Any paid order with no artwork email after 24–48h gets a manual chase.

---

## 4. Architecture

### 4.1 Components

```
┌─────────────────────────────────────────────────────────────┐
│  index.html (existing)                                       │
│    .pt-cell × 16  →  checkout.js (new)                       │
└──────────────────┬──────────────────────────────────────────┘
                   │ POST /api/create-checkout-session
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  functions/api/create-checkout-session.js  (CF Pages Function)
│    validate input  →  lookup price  →  Stripe API create     │
│    session  →  return { url }                                │
└──────────────────┬──────────────────────────────────────────┘
                   │ (Stripe redirects browser to Checkout, then to success_url)
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  order-success.html  +  success.js                           │
│    reads session_id from URL  →  GET /api/checkout-status    │
└──────────────────┬──────────────────────────────────────────┘
                   │ GET /api/checkout-status?session_id=...
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  functions/api/checkout-status.js  (CF Pages Function)       │
│    retrieve session from Stripe  →  return safe subset       │
└─────────────────────────────────────────────────────────────┘

Source of truth for prices:  functions/lib/pricing.js
  ↑                            ↑
  Vitest test asserts both match (functions/lib/pricing.test.js)
  ↓                            ↓
HTML pricing matrix         Server-side amount calculation
(hand-maintained)           (the only authority for pence amounts)
```

### 4.2 New files

| Path | Purpose |
|---|---|
| `functions/api/create-checkout-session.js` | POST handler — creates Stripe Checkout Session |
| `functions/api/checkout-status.js` | GET handler — returns `{ payment_status, ... }` |
| `functions/lib/pricing.js` | 16-SKU price map, `price_version` constant |
| `functions/lib/pricing.test.js` | Vitest — HTML matrix ↔ pricing.js bidirectional drift check |
| `functions/lib/stripe.js` | Stripe SDK init helper (reads `env.STRIPE_SECRET_KEY`) |
| `_routes.json` | Restrict Functions to `/api/*` only |
| `order-success.html` | Static success page |
| `assets/checkout.js` | Frontend handler for `.pt-cell` clicks |
| `assets/success.js` | Frontend handler on success page |

### 4.3 Modified files

| Path | Change |
|---|---|
| `index.html` | Remove quote-prefill click handler on `.pt-cell`; load `checkout.js`; update `<p class="pt-fineprint">` copy from "Click any price to get a quote" → "Click any price to checkout." |
| `script.js` | Remove pricing-matrix click → quote scroll behaviour (`initPricingTable` or equivalent — that function migrates to `checkout.js`). |
| `styles.css` | Add `:disabled` / `[aria-busy]` styles for `.pt-cell` while a request is pending. |
| `package.json` | Add `stripe` (server-side, Functions runtime), bump scripts to include Wrangler for local dev. |
| `_headers` | Add CSP / security headers compatible with Stripe Checkout redirect (form-action, etc.). |

---

## 5. Server-side contracts

### 5.1 `POST /api/create-checkout-session`

**Request (JSON):**
```json
{ "size": "A4", "qty": "20K", "attempt_id": "<uuid-v4>" }
```

**Validation (Function rejects with `400` if any fail):**
- `Content-Type: application/json`.
- `Origin` header equals `env.SITE_URL` exactly. (Reject missing Origin.)
- Body ≤ 1KB.
- `size ∈ {A5, A4, A4+, A3}`.
- `qty ∈ {10K, 20K, 40K, 100K}`.
- `attempt_id` matches UUID v4 regex.

**Server-side computation (the only authority):**
- `{ amount_pence, product_name } = pricing.lookup(size, qty)`.
- `price_version` = `pricing.PRICE_VERSION` (e.g. `"2026-05-sale"`).
- Stripe idempotency key = `checkout:${attempt_id}`.

**Stripe `checkout.sessions.create` shape:**
```js
{
  mode: 'payment',
  payment_method_types: ['card'],
  line_items: [{
    quantity: 1,
    price_data: {
      currency: 'gbp',
      unit_amount: amount_pence,
      product_data: {
        name: product_name,   // e.g. "20,000 × A4 Takeaway Menus, 130gsm, full colour both sides"
        description: 'Free menu design · Free UK delivery · 3–5 working days',
      },
    },
  }],
  shipping_address_collection: { allowed_countries: ['GB'] },
  phone_number_collection: { enabled: true },
  custom_fields: [
    {
      key: 'restaurantname',
      label: { type: 'custom', custom: 'Restaurant / business name' },
      type: 'text',
      optional: false,
    },
    {
      key: 'notes',
      label: { type: 'custom', custom: 'Anything we should know? (optional)' },
      type: 'text',
      optional: true,
    },
  ],
  client_reference_id: attempt_id,
  metadata: {
    sku: `${size}-${qty}`,
    size,
    qty,
    amount_pence: String(amount_pence),
    vat_rate: '0',                    // UK printed menus = zero-rated
    price_version,
    sale_ends: '2026-05-31',
  },
  success_url: `${env.SITE_URL}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${env.SITE_URL}/#pricing`,
}
```

**Response (200):**
```json
{ "url": "https://checkout.stripe.com/c/pay/cs_..." }
```

**Errors:** generic. `400` for any validation failure (no detail). `502` if Stripe call fails (no Stripe error leaked).

### 5.2 `GET /api/checkout-status?session_id=cs_...`

**Validation:**
- `session_id` matches `^cs_(test_|live_)?[A-Za-z0-9]+$`.
- `Origin` or `Referer` indicates own site (looser than POST — this is a read).

**Server:**
- `stripe.checkout.sessions.retrieve(session_id)`.
- Return only safe subset.

**Response (200):**
```json
{
  "payment_status": "paid" | "unpaid" | "no_payment_required",
  "order_ref": "cs_live_...",
  "customer_email": "anon@example.com",
  "amount_total_pence": 55000,
  "restaurant_name": "<from custom_fields>",
  "sku": "A4-20K"
}
```

**Errors:** `404` if session not found, `400` if malformed id, `502` if Stripe fails.

---

## 6. Pricing module — `functions/lib/pricing.js`

```js
export const PRICE_VERSION = '2026-05-sale';
export const SALE_ENDS = '2026-05-31';

// All amounts in pence. Single source of truth.
export const PRICES = {
  'A5-10K':  { amount_pence:  20000, product_name: '10,000 × A5 Takeaway Menus, 130gsm, full colour both sides'  },
  'A5-20K':  { amount_pence:  25000, product_name: '20,000 × A5 Takeaway Menus, 130gsm, full colour both sides'  },
  'A5-40K':  { amount_pence:  40000, product_name: '40,000 × A5 Takeaway Menus, 130gsm, full colour both sides'  },
  'A5-100K': { amount_pence:  90000, product_name: '100,000 × A5 Takeaway Menus, 130gsm, full colour both sides' },
  'A4-10K':  { amount_pence:  42500, product_name: '10,000 × A4 Takeaway Menus, 130gsm, full colour both sides'  },
  'A4-20K':  { amount_pence:  55000, product_name: '20,000 × A4 Takeaway Menus, 130gsm, full colour both sides'  },
  'A4-40K':  { amount_pence:  90000, product_name: '40,000 × A4 Takeaway Menus, 130gsm, full colour both sides'  },
  'A4-100K': { amount_pence: 160000, product_name: '100,000 × A4 Takeaway Menus, 130gsm, full colour both sides' },
  'A4+-10K': { amount_pence:  47500, product_name: '10,000 × A4+ Takeaway Menus, 130gsm, full colour both sides' },
  'A4+-20K': { amount_pence:  75000, product_name: '20,000 × A4+ Takeaway Menus, 130gsm, full colour both sides' },
  'A4+-40K': { amount_pence: 125000, product_name: '40,000 × A4+ Takeaway Menus, 130gsm, full colour both sides' },
  'A4+-100K':{ amount_pence: 230000, product_name: '100,000 × A4+ Takeaway Menus, 130gsm, full colour both sides'},
  'A3-10K':  { amount_pence:  52500, product_name: '10,000 × A3 Takeaway Menus, 130gsm, full colour both sides'  },
  'A3-20K':  { amount_pence:  79500, product_name: '20,000 × A3 Takeaway Menus, 130gsm, full colour both sides'  },
  'A3-40K':  { amount_pence: 145000, product_name: '40,000 × A3 Takeaway Menus, 130gsm, full colour both sides' },
  'A3-100K': { amount_pence: 280000, product_name: '100,000 × A3 Takeaway Menus, 130gsm, full colour both sides' },
};

export function lookup(size, qty) {
  const sku = `${size}-${qty}`;
  const entry = PRICES[sku];
  if (!entry) throw new Error(`unknown sku: ${sku}`);
  return entry;
}
```

(Amounts derived from `data-price` attributes in `index.html` lines 296–326, × 100 to convert £ → pence.)

---

## 7. Pricing drift test — `functions/lib/pricing.test.js`

Using already-installed `vitest` + `jsdom`. Bidirectional check:

1. Parse `index.html`, find every `.pt-cell[data-size][data-qty][data-price]`.
2. For each `(size, qty, price)` tuple: assert `pricing.PRICES[\`${size}-${qty}\`].amount_pence === price * 100`.
3. For each key in `pricing.PRICES`: assert HTML contains a matching `.pt-cell`.
4. Assert `pricing.PRICE_VERSION` equals an expected constant in the test (so changing prices requires a test-file edit too, forcing a deliberate version bump).

Failure messages name the SKU directly (not a snapshot diff).

---

## 8. Frontend

### 8.1 `assets/checkout.js`

- Replaces the existing pricing-matrix click handler in `script.js` (which today calls `applyPrefill` and scrolls to the quote form).
- On `.pt-cell` click or `Enter`/`Space`:
  1. Read `data-size` and `data-qty`.
  2. Disable the cell (`aria-busy="true"`, pointer-events: none), update accessible status (`aria-live` region: "Preparing checkout…").
  3. Generate `attempt_id` via `crypto.randomUUID()`.
  4. `fetch('/api/create-checkout-session', { method: 'POST', headers, body: JSON.stringify({ size, qty, attempt_id }) })`.
  5. On `200`: `window.location.assign(json.url)`.
  6. On failure: re-enable cell, show inline error "Could not start checkout — please try again or call us on 01274 305555."

### 8.2 `order-success.html` + `assets/success.js`

- Page initial state shows: "Checking payment…" + spinner.
- Reads `session_id` from `URL.searchParams`.
- If missing: shows neutral fallback ("Looking for an order? Email hello@printmenu.co.uk").
- Else: `GET /api/checkout-status?session_id=...`.
- If `payment_status === 'paid'`:
  - Big H1: "Order received — let's design your menu."
  - Order ref displayed in a copyable box.
  - Big `<a class="btn btn-primary" href="mailto:hello@printmenu.co.uk?subject=...&body=...">Email your artwork</a>`. Subject and body are short and URL-encoded via `URLSearchParams`. Body template:
    ```
    Order ref: cs_xxx
    Restaurant name:
    Notes:
    ```
  - Below the button, plain-text fallback: "Or email **hello@printmenu.co.uk** quoting order ref **cs_xxx**." Order ref has a copy-to-clipboard button.
  - "What happens next" sub-section (free design → approval → print → delivery).
- If `payment_status !== 'paid'`:
  - Neutral message: "We couldn't confirm your payment yet. If you've been charged, please email hello@printmenu.co.uk and we'll sort it."
  - No artwork-email instructions shown.

### 8.3 Pricing matrix copy change

In `index.html`:

```diff
-<p class="pt-fineprint">Click any price to get a quote for that quantity and size.</p>
+<p class="pt-fineprint">Click any price to checkout. Free design &amp; UK delivery included.</p>
```

---

## 9. Cloudflare Pages config

### 9.1 `_routes.json`

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

So only `/api/*` requests invoke Functions; static pages skip the Functions runtime entirely (cost + cold-start).

### 9.2 Environment variables (set in CF Pages dashboard, both Production and Preview)

| Var | Value (prod) | Value (preview) |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | `sk_test_...` |
| `SITE_URL` | `https://printmenu.co.uk` | `https://<branch>.printmenu-co-uk.pages.dev` (or test URL) |

### 9.3 Stripe Dashboard config (manual, documented in runbook)

- Enable "Successful payment" customer receipt emails.
- Enable merchant payment notifications (hello@printmenu.co.uk).
- Enable dispute / refund notifications.
- Branding: upload PrintMenu logo, set colours (navy `#11295A`, cyan `#06B5E2`).

### 9.4 Local dev

- `npm run dev:functions` → `wrangler pages dev . --port 8080`.
- `.dev.vars` file (gitignored) holds local `STRIPE_SECRET_KEY=sk_test_...` and `SITE_URL=http://localhost:8080`.

---

## 10. Security

- Server is the only authority for prices (client never passes an amount).
- `Origin` check on `POST` strict-equals `SITE_URL`. Missing Origin → reject.
- POST body capped at 1KB.
- Stripe secret key never reaches the client. CF Pages Function env only.
- No PII logged. Function logs request shape only (`{ size, qty, ok|fail }`), never email / name / phone.
- CSP in `_headers` allows redirect to `checkout.stripe.com` (`form-action`).
- Customer-facing `404`/`502` from `/api/checkout-status` for malformed session IDs (no Stripe error leaked).

---

## 11. Operational reality (must read)

**v1 has no webhook.** This means:

- If a customer successfully pays but never reaches `/order-success.html` (closes tab, network drop after 3DS), the site has no record of the order.
- For these cases, **Stripe Dashboard is the source of truth**. Stripe's merchant-notification email + the Payments tab show all successful payments regardless of whether the customer returned.
- **Junaid's daily ops task:** review Stripe Dashboard, cross-reference incoming `hello@printmenu.co.uk` emails, chase any paid order with no artwork after 24–48h.
- This is sustainable at low volume. If volume grows beyond ~10 orders/day, v1.1 should add a webhook + reminder email automation.

Refunds, chargebacks, disputes: handled entirely in the Stripe Dashboard manually.

---

## 12. Test plan

| Test | Tool | What it asserts |
|---|---|---|
| `pricing.test.js` | Vitest + jsdom | HTML matrix ↔ `pricing.js` exact match in both directions |
| `create-checkout-session.test.js` | Vitest + mocked Stripe SDK | Valid `{size, qty}` returns 200 with url; invalid size/qty → 400; bad Origin → 400; oversized body → 400; price comes from `pricing.lookup`, never from request body |
| `checkout-status.test.js` | Vitest + mocked Stripe SDK | Malformed session id → 400; not found → 404; happy path returns only safe subset |
| `e2e-checkout.spec.js` | Playwright (test mode) | Click `.pt-cell` → redirected to Stripe Checkout URL (don't fill — just verify redirect); back-button cancels to `/#pricing` |

E2E pays with a Stripe **test mode** key and Stripe's `4242 4242 4242 4242` card.

---

## 13. Lead / follow split

Agreed with Codex round 1:

| Section | Lead | Follow | Pair-review trigger |
|---|---|---|---|
| Product flow & acceptance criteria | Claude | Junaid | Any change to paid flow or artwork instruction |
| Stripe Checkout params | Codex | Claude | Payment methods, custom fields, metadata, URLs |
| No-webhook operating model | Junaid | Codex | Any need for fulfilment automation, exports, refunds |
| Pricing module + drift test | Claude | Codex | Any price/date change |
| CF Pages Functions / env / routes | Codex | Claude | Secrets, `_routes.json`, Wrangler dev, API routes |
| Frontend UX & accessibility | Claude | Codex | `.pt-cell` behaviour, success page |
| VAT / tax treatment | Junaid + accountant | Claude | Any non-menu product, separate design fee, mail service |

---

## 14. Out of scope (explicit, for future specs)

- **v1.1 — Webhook + artwork-chase automation.** `POST /api/stripe-webhook`, signature verification, a single email reminder at T+24h via Resend or CF Email Workers.
- **v1.2 — Artwork upload.** CF R2 bucket, signed-URL upload endpoint, success-page upload widget.
- **v1.3 — Customer accounts.** Re-order with one click, order history.
- **Broken Netlify quote form** (`netlify data-netlify="true"` on CF Pages — currently silently drops submissions). **Separate spec.** Not blocking Stripe v1.

---

## 15. Open questions for Junaid

None blocking. Everything's been settled in two rounds with Codex. One non-blocking confirmation:

- The Stripe Dashboard branding (logo, colours, business name) hasn't been done — that's a 10-minute job in the Dashboard before going live.

(`hello@printmenu.co.uk` confirmed set up — used for both artwork submission and merchant notifications.)
