# Stripe Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable self-serve Stripe Checkout for the 16-SKU pricing matrix on printmenu.co.uk, with no webhook and no DB — Stripe Dashboard is the order system.

**Architecture:** Static site (Cloudflare Pages) + 2 Pages Functions (`POST /api/create-checkout-session`, `GET /api/checkout-status`) + Stripe-hosted Checkout. Server-side price authority via `functions/lib/pricing.js` with a Vitest drift test asserting the HTML matrix matches.

**Tech Stack:** Cloudflare Pages Functions (Workers runtime), Stripe Node SDK (`stripe` v17+ with `createFetchHttpClient`), Vitest + jsdom (already installed), Playwright (already installed), Wrangler for local dev.

**Spec:** [`docs/superpowers/specs/2026-05-20-stripe-checkout-design.md`](../specs/2026-05-20-stripe-checkout-design.md) — read this before starting.

---

## Pre-flight

Before Task 1, confirm you're on `main` (no worktree was created), `git status -s` is clean except for this plan file, and `npm install` runs without errors.

You also need a Stripe **test mode** secret key (`sk_test_…`) for local testing. Get it from `dashboard.stripe.com/test/apikeys`. Don't put it in any committed file — only in `.dev.vars`.

---

## Task 1: Add dependencies & local dev setup

**Files:**
- Modify: `package.json`
- Create: `.dev.vars.example`
- Modify: `.gitignore`

- [ ] **Step 1: Install `stripe` (runtime) and `wrangler` (dev-only)**

Run:
```bash
npm i stripe@^17
npm i -D wrangler@^3
```

Expected: `package.json` gains `"stripe"` under `dependencies` and `"wrangler"` under `devDependencies`. Lockfile updates.

- [ ] **Step 2: Add npm scripts for local Functions dev**

Edit `package.json` `"scripts"` to add:
```json
"dev:functions": "wrangler pages dev . --port 8788 --compatibility-date=2025-01-01"
```

(Keep existing `dev`/`test`/`test:e2e` scripts untouched.)

- [ ] **Step 3: Create `.dev.vars.example` (committed) for documentation**

Create `.dev.vars.example`:
```
STRIPE_SECRET_KEY=sk_test_replace_me
SITE_URL=http://localhost:8788
```

- [ ] **Step 4: Add `.dev.vars` to `.gitignore`**

Append to `.gitignore`:
```
.dev.vars
```

(If `.gitignore` doesn't exist yet, create it with this single line. Check first with `cat .gitignore` — repo may already ignore other things; preserve those.)

- [ ] **Step 5: Locally create `.dev.vars` (uncommitted) with your real test key**

Copy `.dev.vars.example` → `.dev.vars` and fill in your `sk_test_…` key. Don't commit.

- [ ] **Step 6: Verify install**

Run:
```bash
npm test 2>&1 | tail -10
npx wrangler --version
```

Expected: existing unit tests still pass; wrangler prints a version like `4.x.x`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .dev.vars.example .gitignore
git commit -m "Add stripe + wrangler deps for checkout"
```

---

## Task 2: Pricing module + drift test (TDD)

**Files:**
- Create: `functions/lib/pricing.js`
- Create: `tests/unit/pricing.test.js`

The test is written **against the existing `index.html` matrix** — the test will fail until `pricing.js` exists with matching numbers.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/pricing.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { PRICES, PRICE_VERSION, SALE_ENDS, lookup } from '../../functions/lib/pricing.js';

const INDEX_HTML = readFileSync(
  fileURLToPath(new URL('../../index.html', import.meta.url)),
  'utf8'
);
const cells = [...new JSDOM(INDEX_HTML).window.document
  .querySelectorAll('.pt-cell[data-size][data-qty][data-price]')];

describe('pricing module', () => {
  it('exports the expected price version', () => {
    expect(PRICE_VERSION).toBe('2026-05-sale');
  });

  it('exports the sale end date', () => {
    expect(SALE_ENDS).toBe('2026-05-31');
  });

  it('lookup returns amount + name for valid SKU', () => {
    const r = lookup('A4', '20K');
    expect(r.amount_pence).toBe(55000);
    expect(r.product_name).toMatch(/A4/);
  });

  it('lookup throws on unknown SKU', () => {
    expect(() => lookup('B5', '20K')).toThrow(/unknown sku/i);
  });
});

describe('pricing drift vs index.html matrix', () => {
  it('has at least 16 cells in the HTML matrix', () => {
    expect(cells.length).toBeGreaterThanOrEqual(16);
  });

  it('every HTML cell has an exact pricing.js match (in pence)', () => {
    for (const cell of cells) {
      const size = cell.dataset.size;
      const qty = cell.dataset.qty;
      const pricePounds = parseInt(cell.dataset.price, 10);
      const sku = `${size}-${qty}`;
      expect(PRICES, `missing pricing entry for ${sku}`).toHaveProperty(sku);
      expect(PRICES[sku].amount_pence, `mismatch for ${sku} (HTML £${pricePounds})`)
        .toBe(pricePounds * 100);
    }
  });

  it('every pricing.js entry has a matching HTML cell', () => {
    for (const sku of Object.keys(PRICES)) {
      // Split on the hyphen that precedes a digit (handles "A4+-20K").
      const [size, qty] = sku.split(/-(?=\d)/);
      const found = cells.some(c => c.dataset.size === size && c.dataset.qty === qty);
      expect(found, `no HTML cell for ${sku}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

Run:
```bash
npm test -- tests/unit/pricing.test.js
```

Expected: FAIL, with errors about cannot resolve `'../../functions/lib/pricing.js'`.

- [ ] **Step 3: Create the pricing module**

Create `functions/lib/pricing.js`:
```js
// Source of truth for all menu printing prices.
// Amounts in pence (Stripe convention). Bidirectional drift test in
// tests/unit/pricing.test.js asserts these match index.html .pt-cell data-price.

export const PRICE_VERSION = '2026-05-sale';
export const SALE_ENDS = '2026-05-31';

export const PRICES = {
  'A5-10K':   { amount_pence:  20000, product_name: '10,000 × A5 Takeaway Menus, 130gsm, full colour both sides'   },
  'A5-20K':   { amount_pence:  25000, product_name: '20,000 × A5 Takeaway Menus, 130gsm, full colour both sides'   },
  'A5-40K':   { amount_pence:  40000, product_name: '40,000 × A5 Takeaway Menus, 130gsm, full colour both sides'   },
  'A5-100K':  { amount_pence:  90000, product_name: '100,000 × A5 Takeaway Menus, 130gsm, full colour both sides'  },
  'A4-10K':   { amount_pence:  42500, product_name: '10,000 × A4 Takeaway Menus, 130gsm, full colour both sides'   },
  'A4-20K':   { amount_pence:  55000, product_name: '20,000 × A4 Takeaway Menus, 130gsm, full colour both sides'   },
  'A4-40K':   { amount_pence:  90000, product_name: '40,000 × A4 Takeaway Menus, 130gsm, full colour both sides'   },
  'A4-100K':  { amount_pence: 160000, product_name: '100,000 × A4 Takeaway Menus, 130gsm, full colour both sides'  },
  'A4+-10K':  { amount_pence:  47500, product_name: '10,000 × A4+ Takeaway Menus, 130gsm, full colour both sides'  },
  'A4+-20K':  { amount_pence:  75000, product_name: '20,000 × A4+ Takeaway Menus, 130gsm, full colour both sides'  },
  'A4+-40K':  { amount_pence: 125000, product_name: '40,000 × A4+ Takeaway Menus, 130gsm, full colour both sides'  },
  'A4+-100K': { amount_pence: 230000, product_name: '100,000 × A4+ Takeaway Menus, 130gsm, full colour both sides' },
  'A3-10K':   { amount_pence:  52500, product_name: '10,000 × A3 Takeaway Menus, 130gsm, full colour both sides'   },
  'A3-20K':   { amount_pence:  79500, product_name: '20,000 × A3 Takeaway Menus, 130gsm, full colour both sides'   },
  'A3-40K':   { amount_pence: 145000, product_name: '40,000 × A3 Takeaway Menus, 130gsm, full colour both sides'   },
  'A3-100K':  { amount_pence: 280000, product_name: '100,000 × A3 Takeaway Menus, 130gsm, full colour both sides'  },
};

export function lookup(size, qty) {
  const sku = `${size}-${qty}`;
  const entry = PRICES[sku];
  if (!entry) throw new Error(`unknown sku: ${sku}`);
  return entry;
}
```

- [ ] **Step 4: Run the test — verify it passes**

Run:
```bash
npm test -- tests/unit/pricing.test.js
```

Expected: PASS — all 6 tests green. If any drift assertion fails, **stop** and reconcile against `index.html` lines 296–326 before changing the pricing module. The HTML is the user-facing source of pricing; the JS must match it.

- [ ] **Step 5: Commit**

```bash
git add functions/lib/pricing.js tests/unit/pricing.test.js
git commit -m "Add pricing module + drift test"
```

---

## Task 3: Stripe SDK helper

**Files:**
- Create: `functions/lib/stripe.js`

Tiny module. No tests — it's a thin factory that we'll exercise through the route tests.

- [ ] **Step 1: Create the helper**

Create `functions/lib/stripe.js`:
```js
import Stripe from 'stripe';

/**
 * Create a Stripe client suitable for the Cloudflare Pages Functions runtime.
 * Uses the fetch-based HTTP client (the Node http client is unavailable here).
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export function createStripeClient(env) {
  if (!env?.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    apiVersion: '2024-12-18.acacia',
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/lib/stripe.js
git commit -m "Add Stripe SDK helper for Pages Functions runtime"
```

---

## Task 4: `POST /api/create-checkout-session` — tests first

**Files:**
- Create: `tests/unit/api/create-checkout-session.test.js`
- Create: `functions/api/create-checkout-session.js`

Update Vitest include glob to pick up tests under `tests/unit/api/`.

- [ ] **Step 1: Update Vitest config to include nested unit tests**

Edit `vitest.config.js`:
```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
  },
});
```

(Already uses `**`, so nested paths are already included. Verify by reading the file — if the glob is single-level, change it to `**`.)

- [ ] **Step 2: Write the failing tests**

Create `tests/unit/api/create-checkout-session.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock the stripe module BEFORE importing the route handler ---
const mockCreate = vi.fn();
vi.mock('stripe', () => {
  function Stripe() {
    return { checkout: { sessions: { create: mockCreate } } };
  }
  Stripe.createFetchHttpClient = vi.fn(() => ({}));
  return { default: Stripe };
});

import { onRequestPost } from '../../../functions/api/create-checkout-session.js';

const ENV = { STRIPE_SECRET_KEY: 'sk_test_xxx', SITE_URL: 'https://printmenu.co.uk' };
const UUID = '550e8400-e29b-41d4-a716-446655440000';

function makeReq(body, opts = {}) {
  const json = JSON.stringify(body);
  return new Request('https://printmenu.co.uk/api/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': opts.contentType ?? 'application/json',
      'Origin': opts.origin ?? 'https://printmenu.co.uk',
      'Content-Length': String(json.length),
    },
    body: json,
  });
}

beforeEach(() => {
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({ url: 'https://checkout.stripe.com/c/pay/cs_test_123' });
});

describe('POST /api/create-checkout-session', () => {
  it('returns 200 + checkout url for a valid request', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('rejects an unknown size', async () => {
    const req = makeReq({ size: 'B5', qty: '20K', attempt_id: UUID });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('rejects an unknown quantity', async () => {
    const req = makeReq({ size: 'A4', qty: '5K', attempt_id: UUID });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed attempt_id', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: 'not-a-uuid' });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
  });

  it('rejects wrong Origin', async () => {
    const req = makeReq(
      { size: 'A4', qty: '20K', attempt_id: UUID },
      { origin: 'https://evil.example.com' }
    );
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
  });

  it('rejects non-JSON Content-Type', async () => {
    const req = makeReq(
      { size: 'A4', qty: '20K', attempt_id: UUID },
      { contentType: 'text/plain' }
    );
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
  });

  it('passes the Stripe idempotency key derived from attempt_id', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    await onRequestPost({ request: req, env: ENV });
    const opts = mockCreate.mock.calls[0][1];
    expect(opts?.idempotencyKey).toBe(`checkout:${UUID}`);
  });

  it('uses server-side amount, NEVER client-supplied amount', async () => {
    // Client tries to send amount_pence: 1 — must be ignored.
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID, amount_pence: 1 });
    await onRequestPost({ request: req, env: ENV });
    const params = mockCreate.mock.calls[0][0];
    expect(params.line_items[0].price_data.unit_amount).toBe(55000);
  });

  it('sets GBP, cards-only, GB shipping only', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    await onRequestPost({ request: req, env: ENV });
    const params = mockCreate.mock.calls[0][0];
    expect(params.line_items[0].price_data.currency).toBe('gbp');
    expect(params.payment_method_types).toEqual(['card']);
    expect(params.shipping_address_collection.allowed_countries).toEqual(['GB']);
  });

  it('attaches metadata including vat_rate=0 and sale_ends=2026-05-31', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    await onRequestPost({ request: req, env: ENV });
    const params = mockCreate.mock.calls[0][0];
    expect(params.metadata.sku).toBe('A4-20K');
    expect(params.metadata.vat_rate).toBe('0');
    expect(params.metadata.sale_ends).toBe('2026-05-31');
    expect(params.metadata.price_version).toBe('2026-05-sale');
    expect(params.client_reference_id).toBe(UUID);
  });

  it('uses absolute success/cancel URLs from env.SITE_URL', async () => {
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    await onRequestPost({ request: req, env: ENV });
    const params = mockCreate.mock.calls[0][0];
    expect(params.success_url).toBe(
      'https://printmenu.co.uk/order-success.html?session_id={CHECKOUT_SESSION_ID}'
    );
    expect(params.cancel_url).toBe('https://printmenu.co.uk/#pricing');
  });

  it('returns 502 if Stripe API call fails', async () => {
    mockCreate.mockRejectedValueOnce(new Error('boom'));
    const req = makeReq({ size: 'A4', qty: '20K', attempt_id: UUID });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(502);
  });
});
```

- [ ] **Step 3: Run tests — verify they all fail (module missing)**

Run:
```bash
npm test -- tests/unit/api/create-checkout-session.test.js
```

Expected: FAIL — cannot resolve `'../../../functions/api/create-checkout-session.js'`.

- [ ] **Step 4: Implement the route handler**

Create `functions/api/create-checkout-session.js`:
```js
import { createStripeClient } from '../lib/stripe.js';
import { lookup, PRICE_VERSION, SALE_ENDS } from '../lib/pricing.js';

const VALID_SIZES = ['A5', 'A4', 'A4+', 'A3'];
const VALID_QTYS = ['10K', '20K', '40K', '100K'];
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_BODY_BYTES = 1024;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // Strict origin check (POST requires browser-origin match).
  if (request.headers.get('Origin') !== env.SITE_URL) {
    return json(400, { error: 'bad request' });
  }

  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json(400, { error: 'bad request' });
  }

  const lenHdr = parseInt(request.headers.get('Content-Length') || '0', 10);
  if (lenHdr > MAX_BODY_BYTES) {
    return json(400, { error: 'bad request' });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: 'bad request' });
  }

  const { size, qty, attempt_id } = body || {};
  if (
    !VALID_SIZES.includes(size) ||
    !VALID_QTYS.includes(qty) ||
    typeof attempt_id !== 'string' ||
    !UUID_V4_RE.test(attempt_id)
  ) {
    return json(400, { error: 'bad request' });
  }

  let amount_pence, product_name;
  try {
    ({ amount_pence, product_name } = lookup(size, qty));
  } catch {
    return json(400, { error: 'bad request' });
  }

  const stripe = createStripeClient(env);

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{
          quantity: 1,
          price_data: {
            currency: 'gbp',
            unit_amount: amount_pence,
            product_data: {
              name: product_name,
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
          vat_rate: '0',
          price_version: PRICE_VERSION,
          sale_ends: SALE_ENDS,
        },
        success_url: `${env.SITE_URL}/order-success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.SITE_URL}/#pricing`,
      },
      { idempotencyKey: `checkout:${attempt_id}` }
    );

    return json(200, { url: session.url });
  } catch {
    return json(502, { error: 'upstream' });
  }
}
```

- [ ] **Step 5: Run tests — verify all pass**

Run:
```bash
npm test -- tests/unit/api/create-checkout-session.test.js
```

Expected: PASS — all 12 tests green.

- [ ] **Step 6: Commit**

```bash
git add functions/api/create-checkout-session.js tests/unit/api/create-checkout-session.test.js vitest.config.js
git commit -m "Add POST /api/create-checkout-session with tests"
```

---

## Task 5: `GET /api/checkout-status` — tests first

**Files:**
- Create: `tests/unit/api/checkout-status.test.js`
- Create: `functions/api/checkout-status.js`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/api/checkout-status.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRetrieve = vi.fn();
vi.mock('stripe', () => {
  function Stripe() {
    return { checkout: { sessions: { retrieve: mockRetrieve } } };
  }
  Stripe.createFetchHttpClient = vi.fn(() => ({}));
  return { default: Stripe };
});

import { onRequestGet } from '../../../functions/api/checkout-status.js';

const ENV = { STRIPE_SECRET_KEY: 'sk_test_xxx', SITE_URL: 'https://printmenu.co.uk' };
const VALID_SESSION_ID = 'cs_test_a1b2c3D4E5F6';

function makeReq(qs = '', opts = {}) {
  return new Request(`https://printmenu.co.uk/api/checkout-status${qs}`, {
    method: 'GET',
    headers: {
      'Origin': opts.origin ?? 'https://printmenu.co.uk',
    },
  });
}

beforeEach(() => {
  mockRetrieve.mockReset();
});

describe('GET /api/checkout-status', () => {
  it('returns safe subset when payment_status=paid', async () => {
    mockRetrieve.mockResolvedValue({
      id: VALID_SESSION_ID,
      payment_status: 'paid',
      amount_total: 55000,
      customer_details: { email: 'a@b.co' },
      custom_fields: [
        { key: 'restaurantname', text: { value: 'Tony\'s Pizza' } },
        { key: 'notes', text: { value: '' } },
      ],
      metadata: { sku: 'A4-20K' },
    });
    const res = await onRequestGet({ request: makeReq(`?session_id=${VALID_SESSION_ID}`), env: ENV });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({
      payment_status: 'paid',
      order_ref: VALID_SESSION_ID,
      customer_email: 'a@b.co',
      amount_total_pence: 55000,
      restaurant_name: 'Tony\'s Pizza',
      sku: 'A4-20K',
    });
  });

  it('returns 400 for missing session_id', async () => {
    const res = await onRequestGet({ request: makeReq(''), env: ENV });
    expect(res.status).toBe(400);
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed session_id', async () => {
    const res = await onRequestGet({ request: makeReq('?session_id=not_a_session'), env: ENV });
    expect(res.status).toBe(400);
    expect(mockRetrieve).not.toHaveBeenCalled();
  });

  it('returns 404 when Stripe says resource_missing', async () => {
    const err = Object.assign(new Error('No such session'), {
      code: 'resource_missing',
      statusCode: 404,
    });
    mockRetrieve.mockRejectedValue(err);
    const res = await onRequestGet({ request: makeReq(`?session_id=${VALID_SESSION_ID}`), env: ENV });
    expect(res.status).toBe(404);
  });

  it('returns 502 on other Stripe errors', async () => {
    mockRetrieve.mockRejectedValue(new Error('boom'));
    const res = await onRequestGet({ request: makeReq(`?session_id=${VALID_SESSION_ID}`), env: ENV });
    expect(res.status).toBe(502);
  });

  it('rejects wrong Origin', async () => {
    const res = await onRequestGet({
      request: makeReq(`?session_id=${VALID_SESSION_ID}`, { origin: 'https://evil.example.com' }),
      env: ENV,
    });
    expect(res.status).toBe(400);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run:
```bash
npm test -- tests/unit/api/checkout-status.test.js
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the route**

Create `functions/api/checkout-status.js`:
```js
import { createStripeClient } from '../lib/stripe.js';

const SESSION_ID_RE = /^cs_(test_|live_)?[A-Za-z0-9]+$/;

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('session_id');

  if (!sessionId || !SESSION_ID_RE.test(sessionId)) {
    return json(400, { error: 'bad request' });
  }

  // Soft origin check: if Origin is present and doesn't match SITE_URL, reject.
  const origin = request.headers.get('Origin');
  if (origin && !origin.startsWith(env.SITE_URL)) {
    return json(400, { error: 'bad request' });
  }

  const stripe = createStripeClient(env);

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const restaurantField = session.custom_fields?.find(f => f.key === 'restaurantname');
    return json(200, {
      payment_status: session.payment_status,
      order_ref: session.id,
      customer_email: session.customer_details?.email ?? null,
      amount_total_pence: session.amount_total,
      restaurant_name: restaurantField?.text?.value || null,
      sku: session.metadata?.sku ?? null,
    });
  } catch (err) {
    if (err?.code === 'resource_missing' || err?.statusCode === 404) {
      return json(404, { error: 'not found' });
    }
    return json(502, { error: 'upstream' });
  }
}
```

- [ ] **Step 4: Run tests — verify all pass**

Run:
```bash
npm test -- tests/unit/api/checkout-status.test.js
```

Expected: PASS — 6 tests green.

- [ ] **Step 5: Commit**

```bash
git add functions/api/checkout-status.js tests/unit/api/checkout-status.test.js
git commit -m "Add GET /api/checkout-status with tests"
```

---

## Task 6: `_routes.json` (restrict Functions to `/api/*`)

**Files:**
- Create: `_routes.json`

- [ ] **Step 1: Create the routing file**

Create `_routes.json` at the repo root:
```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

This tells Cloudflare Pages to only invoke Functions for `/api/*` URLs. Static pages bypass the Functions runtime entirely (faster, cheaper).

- [ ] **Step 2: Verify wrangler picks it up locally**

Run (in a separate terminal, with `.dev.vars` populated):
```bash
npx wrangler pages dev . --port 8788 --compatibility-date=2025-01-01
```

Then in another terminal:
```bash
curl -i -X POST http://localhost:8788/api/create-checkout-session \
  -H 'Content-Type: application/json' \
  -H 'Origin: http://localhost:8788' \
  -d '{"size":"A4","qty":"20K","attempt_id":"550e8400-e29b-41d4-a716-446655440000"}'
```

Expected: `HTTP/1.1 200 OK` + JSON body with a `url` field pointing at `https://checkout.stripe.com/…`. If you get a 400, check `.dev.vars` `SITE_URL=http://localhost:8788`.

Then stop wrangler (Ctrl-C).

- [ ] **Step 3: Commit**

```bash
git add _routes.json
git commit -m "Restrict CF Pages Functions to /api/*"
```

---

## Task 7: Success page HTML + CSS

**Files:**
- Create: `order-success.html`
- Modify: `styles.css` (append new section)

- [ ] **Step 1: Create the success page**

Create `order-success.html`:
```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order received — PrintMenu.co.uk</title>
  <meta name="robots" content="noindex,nofollow" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="stylesheet" href="/styles.css" />
</head>
<body>
  <main class="container success-page" role="main">
    <section id="success-checking" aria-live="polite">
      <h1>Checking your payment…</h1>
      <p>One moment while we confirm the order.</p>
    </section>

    <section id="success-paid" hidden>
      <h1>Order received — let's design your menu.</h1>
      <p class="success-ref">
        Your order reference:
        <code id="order-ref" class="success-ref-code"></code>
        <button type="button" id="copy-ref" class="btn btn-secondary success-copy-btn" aria-label="Copy order reference">Copy</button>
      </p>

      <p>
        <a id="email-artwork" class="btn btn-primary success-cta" href="mailto:hello@printmenu.co.uk">
          Email your artwork →
        </a>
      </p>

      <p class="success-fallback-line">
        Or email <strong>hello@printmenu.co.uk</strong> quoting order ref
        <code id="order-ref-plain"></code>.
      </p>

      <h2>What happens next</h2>
      <ol class="success-steps">
        <li>Email us your menu items (or your current menu) plus any artwork or photos.</li>
        <li>We design your menu free of charge and send you a proof for approval.</li>
        <li>Once you approve, we print and deliver in 3–5 working days.</li>
      </ol>
    </section>

    <section id="success-fallback" hidden>
      <h1>We couldn't confirm your payment yet.</h1>
      <p>If you've been charged, please email
        <a href="mailto:hello@printmenu.co.uk">hello@printmenu.co.uk</a> and we'll sort it out.</p>
    </section>
  </main>
  <script src="/assets/success.js" defer></script>
</body>
</html>
```

- [ ] **Step 2: Add styles for the success page**

Append to `styles.css`:
```css
/* ============================================================
   Section: order-success page
   ============================================================ */
.success-page {
  padding: var(--space-10) var(--space-4);
  max-width: 720px;
  margin: 0 auto;
}
.success-page h1 { margin-bottom: var(--space-4); }
.success-ref {
  background: var(--c-yellow-soft);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
}
.success-ref-code {
  font-family: 'SFMono-Regular', Menlo, monospace;
  font-size: 14px;
  padding: 2px 6px;
  background: var(--c-white);
  border-radius: var(--radius-sm);
  word-break: break-all;
}
.success-copy-btn { margin-left: auto; }
.success-cta {
  display: inline-block;
  font-size: 18px;
  padding: var(--space-4) var(--space-6);
  margin-top: var(--space-4);
}
.success-fallback-line { color: var(--c-text-muted); }
.success-steps { line-height: 1.7; padding-left: var(--space-5); }
```

(Adjust the selector for `.btn-secondary` only if your codebase already defines it. If it doesn't, drop the class — the inline copy button is fine plain.)

- [ ] **Step 3: Smoke-test that the page renders**

Run:
```bash
npm run dev &
sleep 1
curl -sf http://localhost:8080/order-success.html | head -5
kill %1 2>/dev/null
```

Expected: HTML output starts with `<!doctype html>`.

- [ ] **Step 4: Commit**

```bash
git add order-success.html styles.css
git commit -m "Add order-success page + styles"
```

---

## Task 8: Success page JS

**Files:**
- Create: `assets/success.js`

No unit test — this is browser-only DOM glue; we cover it with the Playwright e2e in Task 13.

- [ ] **Step 1: Create `assets/success.js`**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add assets/success.js
git commit -m "Add success-page JS — verify payment + reveal artwork mailto"
```

---

## Task 9: Frontend checkout glue

**Files:**
- Create: `assets/checkout.js`
- Modify: `index.html` (add script tag, change copy)
- Modify: `script.js` (remove obsolete pricing-cell click handler)
- Modify: `styles.css` (append cell-busy state)

This task removes the existing "click a price → scroll to quote form" behaviour and replaces it with "click a price → start Stripe checkout."

- [ ] **Step 1: Find the existing pricing-cell handler in `script.js`**

Run:
```bash
grep -n "pt-cell\|applyPrefill\|prefill" script.js | head -20
```

Expected output includes lines around 50-70 (the `cell.addEventListener('click', handler)` block). Read that function — it's named `initPricingTable` or similar and calls `applyPrefill` then scrolls to `#quote`.

- [ ] **Step 2: Remove the pricing-table click binding from `script.js`**

Open `script.js`. Locate the function that wires up `.pt-cell` click handlers (it iterates over `.pt-cell` and attaches `click` + `keydown`). Delete the entire function plus its call site in the init/DOMContentLoaded chain. Keep `applyPrefill` and the quote-form code untouched — the prefill helper may still be used elsewhere; if `grep` shows it's only called from the deleted handler, remove it too.

After editing, run:
```bash
grep -n "pt-cell" script.js
```

Expected: no matches (or only inside comments).

- [ ] **Step 3: Create `assets/checkout.js`**

```js
// assets/checkout.js — wires .pt-cell clicks to Stripe Checkout via
// /api/create-checkout-session. Replaces the previous quote-prefill handler.
(function () {
  const PHONE = '01274 305555';

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
    const size = cell.dataset.size;
    const qty = cell.dataset.qty;
    if (!size || !qty) return;

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
      if (!url) throw new Error('no-url');
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
```

- [ ] **Step 4: Wire `checkout.js` into `index.html`**

In `index.html`, locate the existing `<script src="/script.js">` tag (likely near the closing `</body>`). Add immediately after it:
```html
<script src="/assets/checkout.js" defer></script>
```

- [ ] **Step 5: Update the matrix copy line**

In `index.html`, find this line (around line 329):
```html
<p class="pt-fineprint">Click any price to get a quote for that quantity and size.</p>
```

Replace with:
```html
<p class="pt-fineprint">Click any price to checkout. Free menu design &amp; UK delivery included.</p>
```

- [ ] **Step 6: Append busy-state CSS**

Append to `styles.css`:
```css
/* Pricing cell busy state (checkout in flight) */
.pt-cell { cursor: pointer; transition: opacity .12s ease; }
.pt-cell:focus-visible {
  outline: 2px solid var(--c-yellow);
  outline-offset: 2px;
}
.pt-cell[aria-busy="true"] {
  opacity: .55;
  pointer-events: none;
  cursor: progress;
}
.checkout-status {
  margin-top: var(--space-4);
  font-size: 14px;
  color: var(--c-text-muted);
  min-height: 1.5em;
}
.checkout-status:empty { display: none; }
```

- [ ] **Step 7: Verify existing unit tests still pass**

Run:
```bash
npm test
```

Expected: All tests pass (pricing drift test will still pass because the data-price attributes weren't touched).

If `tests/unit/prefill.test.js` fails (because `applyPrefill` was removed in Step 2), that's expected — delete `tests/unit/prefill.test.js`. The behaviour it tested no longer exists.

- [ ] **Step 8: Commit**

```bash
git add assets/checkout.js index.html script.js styles.css
git add -u tests/unit/prefill.test.js   # if deleted
git commit -m "Replace pricing-cell quote prefill with Stripe checkout trigger"
```

---

## Task 10: Update `_headers` for Stripe Checkout

**Files:**
- Modify: `_headers`

The redirect to `checkout.stripe.com` is a top-level navigation (`window.location.assign`), not a form submit, so `form-action` doesn't apply. But we add a defensive CSP that allows it anyway, plus `frame-ancestors 'none'` to keep clickjacking off the table.

- [ ] **Step 1: Append CSP to `_headers`**

Open `_headers`. The existing top-of-file block looks like:
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

Add one more header to that same `/*` block (matching indentation — two spaces):
```
  Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; form-action 'self' https://checkout.stripe.com; frame-ancestors 'none'; base-uri 'self'
```

(If the site doesn't load Google Fonts, drop those origins. Check `<head>` of `index.html` first to see what's actually loaded.)

- [ ] **Step 2: Smoke-test that the site still loads**

Run:
```bash
npm run dev &
sleep 1
curl -sI http://localhost:8080/ | grep -i 'content-security'
# Then open http://localhost:8080/ in your browser, open DevTools console,
# confirm no CSP violations on the homepage.
kill %1 2>/dev/null
```

Expected: CSP header present; no console errors. If anything breaks, relax the directive(s) responsible — the Stripe-related bit (`form-action https://checkout.stripe.com`) is the only critical one for v1.

- [ ] **Step 3: Commit**

```bash
git add _headers
git commit -m "Add CSP allowing redirect to checkout.stripe.com"
```

---

## Task 11: Playwright e2e for the click → redirect flow

**Files:**
- Create: `tests/e2e/checkout.spec.js`

We don't run real Stripe in CI — Playwright intercepts `/api/create-checkout-session` and returns a stub URL, then asserts the redirect happens. (Full end-to-end against real Stripe lives behind a manual test in Task 13.)

- [ ] **Step 1: Create the e2e spec**

Create `tests/e2e/checkout.spec.js`:
```js
import { test, expect } from '@playwright/test';

test.describe('Stripe checkout flow', () => {
  test('clicking a price cell triggers redirect to checkout.stripe.com', async ({ page }) => {
    const STUB_URL = 'https://checkout.stripe.com/c/pay/cs_test_PLAYWRIGHT';

    // Intercept the API call and return a fake URL.
    await page.route('**/api/create-checkout-session', async (route) => {
      const req = route.request();
      expect(req.method()).toBe('POST');
      const body = JSON.parse(req.postData() || '{}');
      expect(body).toMatchObject({ size: expect.any(String), qty: expect.any(String) });
      expect(body.attempt_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: STUB_URL }),
      });
    });

    // Block the actual Stripe navigation so the test doesn't leave Playwright.
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'stub' })
    );

    await page.goto('/');
    // Click the A4 / 20K cell.
    const cell = page.locator('.pt-cell[data-size="A4"][data-qty="20K"]');
    await expect(cell).toBeVisible();
    await cell.click();

    // After click we expect a navigation to the stub URL.
    await page.waitForURL(STUB_URL, { timeout: 5000 });
  });

  test('cell goes aria-busy while request is in flight', async ({ page }) => {
    let release;
    const blocker = new Promise((r) => { release = r; });

    await page.route('**/api/create-checkout-session', async (route) => {
      await blocker;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_BUSY' }),
      });
    });
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'stub' })
    );

    await page.goto('/');
    const cell = page.locator('.pt-cell[data-size="A4"][data-qty="20K"]');
    await cell.click();
    await expect(cell).toHaveAttribute('aria-busy', 'true');
    release();
    await page.waitForURL('https://checkout.stripe.com/**', { timeout: 5000 });
  });

  test('shows fallback error when API returns 500', async ({ page }) => {
    await page.route('**/api/create-checkout-session', (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"upstream"}' })
    );

    await page.goto('/');
    const cell = page.locator('.pt-cell[data-size="A5"][data-qty="10K"]');
    await cell.click();
    await expect(page.locator('#checkout-status')).toContainText(/could not start checkout/i);
    await expect(cell).toHaveAttribute('aria-busy', 'false');
  });
});
```

- [ ] **Step 2: Run the e2e suite for this spec**

Run:
```bash
npx playwright install chromium  # one-off, if not already done
npm run test:e2e -- tests/e2e/checkout.spec.js --project=desktop
```

Expected: 3 tests pass on desktop project. If you also want mobile coverage, drop the `--project` filter.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/checkout.spec.js
git commit -m "Add Playwright e2e for checkout click → redirect"
```

---

## Task 12: Full local round-trip (manual smoke test, not committed)

This isn't a code task — it's a hand-test you do once to verify everything wires up before deploy.

- [ ] **Step 1: Start Wrangler with Functions + static**

In one terminal:
```bash
npx wrangler pages dev . --port 8788 --compatibility-date=2025-01-01
```

In another terminal, visit `http://localhost:8788/` in your browser.

- [ ] **Step 2: Make a real test-mode purchase**

1. Click any price cell on the homepage.
2. You should be redirected to a Stripe Checkout page (test mode).
3. Use card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any postcode.
4. Fill the custom field "Restaurant / business name" with anything (e.g. "Test Bistro").
5. Complete payment.
6. You should land on `http://localhost:8788/order-success.html?session_id=cs_test_…` with:
   - "Checking your payment…" briefly,
   - Then the "Order received" heading,
   - The order ref shown in a code block,
   - The "Email your artwork →" button, which when clicked opens your mail client with a pre-filled subject/body.

- [ ] **Step 3: Verify Stripe Dashboard**

Open [dashboard.stripe.com/test/payments](https://dashboard.stripe.com/test/payments). The payment should appear with the metadata you set: `sku`, `vat_rate=0`, `sale_ends=2026-05-31`, `price_version=2026-05-sale`.

- [ ] **Step 4: Verify the broken-state path**

In your browser, visit `http://localhost:8788/order-success.html` directly (no `session_id` in URL). You should see the fallback "We couldn't confirm your payment yet" message. Visit `http://localhost:8788/order-success.html?session_id=cs_test_invalid_xyz` — you should also see the fallback (because Stripe returns 404).

- [ ] **Step 5: Stop Wrangler.**

No commit — this is a manual sanity gate before the next task.

---

## Task 13: Production deploy checklist (manual)

This task documents the Stripe Dashboard + Cloudflare Pages config steps that aren't in code.

**Files:**
- Create: `docs/superpowers/runbooks/stripe-checkout-launch.md`

- [ ] **Step 1: Write the runbook doc**

Create `docs/superpowers/runbooks/stripe-checkout-launch.md`:
```markdown
# Stripe Checkout — Launch Runbook

## Pre-launch checklist

### Cloudflare Pages dashboard (printmenu-co-uk project)
- [ ] Production environment variable: `STRIPE_SECRET_KEY=sk_live_…`
- [ ] Production environment variable: `SITE_URL=https://printmenu.co.uk`
- [ ] Preview environment variable: `STRIPE_SECRET_KEY=sk_test_…`
- [ ] Preview environment variable: `SITE_URL` = preview branch URL (or test domain)
- [ ] Confirm `_routes.json` is in the deployed build output

### Stripe Dashboard (live mode)
- [ ] Branding: upload PrintMenu logo, set primary colour `#11295A`, accent `#06B5E2`
- [ ] Business profile: address, support email = `hello@printmenu.co.uk`, support phone `01274 305555`
- [ ] Receipt emails: enabled for "Successful payments"
- [ ] Email notifications to merchant (`hello@printmenu.co.uk`):
  - [ ] Successful payments
  - [ ] Failed payments
  - [ ] Refunds
  - [ ] Disputes
- [ ] Card payments: enabled (UK, GBP)
- [ ] Apple Pay + Google Pay: enabled (Stripe handles domain verification automatically once first prod deploy is live)
- [ ] VAT note in business profile: "Printed menus zero-rated under VAT Notice 701/10"

### Smoke test on production (single £25 A5/10K order, then refund)
- [ ] Buy one A5/10K order with a real card → confirm receipt arrives at customer inbox
- [ ] Confirm merchant notification arrives at `hello@printmenu.co.uk`
- [ ] Confirm order ref + custom-field "restaurantname" + metadata visible in Stripe Dashboard
- [ ] Issue full refund from Stripe Dashboard → confirm refund notification arrives

## Daily ops (post-launch)

1. Open Stripe Dashboard once per working day.
2. Cross-reference any new "Paid" payments in the last 24h against incoming `hello@printmenu.co.uk` artwork emails.
3. For any paid order with no artwork email after 24h, send a manual chase from `hello@printmenu.co.uk` quoting the Stripe order ref (`cs_live_…`).
4. Handle refunds, chargebacks, disputes manually in the Stripe Dashboard.

## When to upgrade to v1.1 (add webhook)

Trigger if **any** of these become true:
- More than ~10 orders/day (manual reconciliation no longer scales).
- More than 1 paid-but-no-artwork chase needed per week.
- Need to export orders to a spreadsheet / accounting tool.
- Need to send a reminder email automatically.
```

- [ ] **Step 2: Commit the runbook**

```bash
mkdir -p docs/superpowers/runbooks
git add docs/superpowers/runbooks/stripe-checkout-launch.md
git commit -m "Add Stripe Checkout launch runbook"
```

- [ ] **Step 3: Final full test run**

Run:
```bash
npm test
npm run test:e2e -- --project=desktop
```

Expected: all green. If anything fails, fix before deploying.

- [ ] **Step 4: Deploy**

Push to GitHub `main` — Cloudflare Pages auto-deploys. Verify the live URL works with the test card via a preview deploy first if Cloudflare Pages is configured to use preview branches.

---

## Self-review notes

**Spec coverage checked against `docs/superpowers/specs/2026-05-20-stripe-checkout-design.md`:**

| Spec section | Plan task(s) |
|---|---|
| §3 User journey | Tasks 7–9 (UI) + Task 12 (manual round-trip) |
| §4.2 New files | Tasks 2, 3, 4, 5, 6, 7, 8, 9, 11 |
| §4.3 Modified files | Task 1 (`package.json`), Task 9 (`index.html`, `script.js`, `styles.css`), Task 10 (`_headers`) |
| §5.1 `POST /api/create-checkout-session` | Task 4 (full contract under test) |
| §5.2 `GET /api/checkout-status` | Task 5 (full contract under test) |
| §6 Pricing module | Task 2 |
| §7 Pricing drift test | Task 2 |
| §8 Frontend | Tasks 7, 8, 9 |
| §9.1 `_routes.json` | Task 6 |
| §9.2 CF Pages env vars | Task 13 runbook |
| §9.3 Stripe Dashboard config | Task 13 runbook |
| §9.4 Local dev (Wrangler, `.dev.vars`) | Task 1 |
| §10 Security | Tasks 4, 5 (Origin/CT/body-size + server-side amount), Task 10 (CSP) |
| §11 Operational reality | Task 13 runbook (daily ops + upgrade triggers) |
| §12 Test plan | Tasks 2, 4, 5, 11 |

No gaps identified. No placeholders. Function/method names consistent across tasks (`createStripeClient`, `lookup`, `onRequestPost`, `onRequestGet`, `startCheckout`).

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-stripe-checkout.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
