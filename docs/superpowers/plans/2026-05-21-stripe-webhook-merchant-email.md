# Stripe Webhook — Merchant Email Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send a branded merchant notification email to `hello@printmenu.co.uk` via Resend whenever a Stripe Checkout session completes, giving full visibility of every order without relying on Stripe's dashboard.

**Architecture:** A new CF Pages Function at `/api/stripe-webhook` receives `checkout.session.completed` events from Stripe, verifies the webhook signature using `stripe.webhooks.constructEventAsync()` (Web Crypto compatible), then calls Resend's REST API to send a formatted HTML email to `hello@printmenu.co.uk`. The webhook always returns HTTP 200 to Stripe — email failures are logged but do not cause retries. A dedicated `functions/lib/email.js` helper keeps the email logic isolated and testable.

**Tech Stack:** Stripe webhook signature verification (stripe-node, already installed), Resend REST API (fetch, no SDK — CF Workers compatible), Vitest for unit tests, Cloudflare Pages Functions runtime.

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `functions/api/stripe-webhook.js` | Create | POST handler — verify Stripe signature, dispatch email |
| `functions/lib/email.js` | Create | `sendMerchantNotification(apiKey, order)` — Resend API caller |
| `tests/unit/api/stripe-webhook.test.js` | Create | Unit tests for webhook handler |
| `.dev.vars` | Modify | Add `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY` for local dev |

No changes needed to `_routes.json` (already includes `/api/*`).

---

## Pre-task: Sign up for Resend and verify domain (USER ACTION — no code)

This must be done before any coding. The developer cannot complete this; the site owner must do it.

- [ ] **Step 1: Create Resend account**

  Go to [resend.com](https://resend.com) → Sign up → verify email.

- [ ] **Step 2: Verify the printmenu.co.uk domain**

  In Resend Dashboard → Domains → Add domain → enter `printmenu.co.uk`.

  Resend will give you DNS records to add (SPF, DKIM, DMARC). Add them via your DNS provider (Cloudflare DNS if the domain is on Cloudflare). Wait for Resend to show the domain as **Verified**.

- [ ] **Step 3: Create a Resend API key**

  Resend Dashboard → API Keys → Create API key → name it `printmenu-production` → permission: **Sending access** → copy the key (`re_...`).

- [ ] **Step 4: Add to .dev.vars**

  Add these two lines to `.dev.vars` (gitignored, never committed):

  ```
  STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER_replace_after_task5
  RESEND_API_KEY=re_YOUR_KEY_HERE
  ```

  Leave `STRIPE_WEBHOOK_SECRET` as placeholder for now — it gets replaced in Task 5.

---

## Task 1: Email helper — `functions/lib/email.js`

**Files:**
- Create: `functions/lib/email.js`
- Test: `tests/unit/lib/email.test.js`

- [ ] **Step 1: Write the failing test**

  Create `tests/unit/lib/email.test.js`:

  ```javascript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  // Mock global fetch
  const mockFetch = vi.fn();
  vi.stubGlobal('fetch', mockFetch);

  import { sendMerchantNotification } from '../../../functions/lib/email.js';

  const ORDER = {
    orderRef: 'cs_live_abc123',
    sku: 'A4-10K',
    amountPence: 42500,
    restaurantName: "Tony's Pizza",
    notes: 'Double-sided please',
    customerName: 'Junaid Malik',
    customerEmail: 'customer@example.com',
    customerPhone: '+44 7700 900000',
    shippingAddress: {
      line1: '2 Deepdene Avenue',
      line2: null,
      city: 'Croydon',
      postal_code: 'CR0 5JP',
      country: 'GB',
    },
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('sendMerchantNotification', () => {
    it('calls Resend API with correct headers and returns ok:true on 200', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'msg_1' }) });

      const result = await sendMerchantNotification('re_test_key', ORDER);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.resend.com/emails');
      expect(opts.method).toBe('POST');
      expect(opts.headers['Authorization']).toBe('Bearer re_test_key');
      expect(opts.headers['Content-Type']).toBe('application/json');

      const body = JSON.parse(opts.body);
      expect(body.to).toEqual(['hello@printmenu.co.uk']);
      expect(body.from).toContain('printmenu.co.uk');
      expect(body.subject).toContain('A4-10K');
      expect(body.subject).toContain("Tony's Pizza");
      expect(body.html).toContain('cs_live_abc123');
      expect(body.html).toContain('£425.00');
      expect(body.html).toContain("Tony's Pizza");
      expect(body.html).toContain('customer@example.com');

      expect(result).toEqual({ ok: true });
    });

    it('returns ok:false with error message when Resend returns non-200', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({ message: 'Invalid email' }),
      });

      const result = await sendMerchantNotification('re_test_key', ORDER);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('422');
    });

    it('returns ok:false when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      const result = await sendMerchantNotification('re_test_key', ORDER);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('network error');
    });

    it('formats pence as pounds correctly (42500 → £425.00)', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      await sendMerchantNotification('re_test_key', ORDER);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.html).toContain('£425.00');
    });

    it('shows "None" when notes is empty', async () => {
      mockFetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
      await sendMerchantNotification('re_test_key', { ...ORDER, notes: '' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.html).toContain('None');
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  cd "/Users/junaidmalik/Desktop/Website for Takeaways"
  npx vitest run tests/unit/lib/email.test.js
  ```

  Expected: FAIL — `Cannot find module '../../../functions/lib/email.js'`

- [ ] **Step 3: Implement `functions/lib/email.js`**

  ```javascript
  const MERCHANT_EMAIL = 'hello@printmenu.co.uk';
  const FROM_ADDRESS = 'Print Menu Orders <orders@printmenu.co.uk>';
  const RESEND_API = 'https://api.resend.com/emails';

  /**
   * Format pence as a GBP string: 42500 → "£425.00"
   */
  function formatGBP(pence) {
    return '£' + (pence / 100).toFixed(2);
  }

  /**
   * Format a shipping address object into a readable string.
   */
  function formatAddress(addr) {
    if (!addr) return 'Not provided';
    return [addr.line1, addr.line2, addr.city, addr.postal_code, addr.country]
      .filter(Boolean)
      .join(', ');
  }

  /**
   * Build the HTML email body for a merchant order notification.
   */
  function buildHtml(order) {
    const {
      orderRef, sku, amountPence, restaurantName, notes,
      customerName, customerEmail, customerPhone, shippingAddress,
    } = order;

    const amount = formatGBP(amountPence);
    const address = formatAddress(shippingAddress);
    const notesText = notes?.trim() || 'None';

    return `<!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><title>New Order</title></head>
  <body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
    <h1 style="color:#1a1a2e;font-size:22px;margin-bottom:4px">New order received</h1>
    <p style="color:#555;margin-top:0">printmenu.co.uk</p>
    <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">

    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px 0;color:#555;width:40%">Order reference</td>
          <td style="padding:8px 0;font-weight:600">${orderRef}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Product (SKU)</td>
          <td style="padding:8px 0;font-weight:600">${sku}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Amount paid</td>
          <td style="padding:8px 0;font-weight:600">${amount}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Restaurant / business</td>
          <td style="padding:8px 0;font-weight:600">${restaurantName}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Notes</td>
          <td style="padding:8px 0">${notesText}</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
    <h2 style="font-size:16px;margin-bottom:8px">Customer details</h2>
    <table style="width:100%;border-collapse:collapse;font-size:15px">
      <tr><td style="padding:8px 0;color:#555;width:40%">Name</td>
          <td style="padding:8px 0">${customerName || 'Not provided'}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Email</td>
          <td style="padding:8px 0"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
      <tr><td style="padding:8px 0;color:#555">Phone</td>
          <td style="padding:8px 0">${customerPhone || 'Not provided'}</td></tr>
      <tr><td style="padding:8px 0;color:#555">Delivery address</td>
          <td style="padding:8px 0">${address}</td></tr>
    </table>

    <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
    <p style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:14px">
      <strong>Next step:</strong> Email the customer at
      <a href="mailto:${customerEmail}">${customerEmail}</a> to request their artwork files.
    </p>

    <p style="font-size:12px;color:#999;margin-top:24px">
      View in Stripe Dashboard:
      <a href="https://dashboard.stripe.com/payments/${orderRef}">
        https://dashboard.stripe.com/payments/${orderRef}
      </a>
    </p>
  </body>
  </html>`;
  }

  /**
   * Send a merchant notification email via Resend.
   *
   * @param {string} apiKey  - Resend API key (re_...)
   * @param {object} order   - Order data extracted from Stripe session
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  export async function sendMerchantNotification(apiKey, order) {
    try {
      const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: [MERCHANT_EMAIL],
          subject: `New order: ${order.sku} – ${order.restaurantName} (${order.orderRef})`,
          html: buildHtml(order),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: `Resend ${res.status}: ${body.message ?? 'unknown'}` };
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.message ?? String(err) };
    }
  }
  ```

- [ ] **Step 4: Run tests to verify they pass**

  ```bash
  npx vitest run tests/unit/lib/email.test.js
  ```

  Expected: 5 tests pass.

- [ ] **Step 5: Commit**

  ```bash
  git add functions/lib/email.js tests/unit/lib/email.test.js
  git commit -m "feat: add Resend email helper for merchant order notifications"
  ```

---

## Task 2: Webhook handler — `functions/api/stripe-webhook.js`

**Files:**
- Create: `functions/api/stripe-webhook.js`
- Create: `tests/unit/api/stripe-webhook.test.js`

- [ ] **Step 1: Write the failing tests**

  Create `tests/unit/api/stripe-webhook.test.js`:

  ```javascript
  import { describe, it, expect, vi, beforeEach } from 'vitest';

  // Mock Stripe — constructEventAsync is on the instance
  const { mockConstructEventAsync } = vi.hoisted(() => ({
    mockConstructEventAsync: vi.fn(),
  }));
  vi.mock('stripe', () => {
    function Stripe() {
      return {
        webhooks: { constructEventAsync: mockConstructEventAsync },
      };
    }
    Stripe.createFetchHttpClient = vi.fn(() => ({}));
    return { default: Stripe };
  });

  // Mock email helper
  const { mockSendMerchantNotification } = vi.hoisted(() => ({
    mockSendMerchantNotification: vi.fn(),
  }));
  vi.mock('../../../functions/lib/email.js', () => ({
    sendMerchantNotification: mockSendMerchantNotification,
  }));

  import { onRequestPost } from '../../../functions/api/stripe-webhook.js';

  const ENV = {
    STRIPE_SECRET_KEY: 'sk_test_xxx',
    STRIPE_WEBHOOK_SECRET: 'whsec_test_xxx',
    RESEND_API_KEY: 're_test_xxx',
    SITE_URL: 'https://printmenu.co.uk',
  };

  const COMPLETED_SESSION = {
    id: 'cs_live_abc123',
    object: 'checkout.session',
    payment_status: 'paid',
    amount_total: 42500,
    customer_details: {
      name: 'Junaid Malik',
      email: 'customer@example.com',
      phone: '+44 7700 900000',
    },
    shipping_details: {
      address: {
        line1: '2 Deepdene Avenue',
        line2: null,
        city: 'Croydon',
        postal_code: 'CR0 5JP',
        country: 'GB',
      },
    },
    custom_fields: [
      { key: 'restaurantname', text: { value: "Tony's Pizza" } },
      { key: 'notes', text: { value: 'Double-sided' } },
    ],
    metadata: { sku: 'A4-10K', source: 'printmenu.co.uk' },
  };

  function makeReq(body = '', sig = 'stripe-sig') {
    return new Request('https://printmenu.co.uk/api/stripe-webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': sig,
      },
      body,
    });
  }

  beforeEach(() => {
    mockConstructEventAsync.mockReset();
    mockSendMerchantNotification.mockReset();
  });

  describe('POST /api/stripe-webhook', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new Request('https://printmenu.co.uk/api/stripe-webhook', {
        method: 'POST',
        body: '{}',
      });
      const res = await onRequestPost({ request: req, env: ENV });
      expect(res.status).toBe(400);
    });

    it('returns 400 when signature verification fails', async () => {
      mockConstructEventAsync.mockRejectedValue(new Error('Invalid signature'));
      const res = await onRequestPost({ request: makeReq('{}'), env: ENV });
      expect(res.status).toBe(400);
      expect(mockSendMerchantNotification).not.toHaveBeenCalled();
    });

    it('returns 200 and ignores unhandled event types', async () => {
      mockConstructEventAsync.mockResolvedValue({
        type: 'payment_intent.created',
        data: { object: {} },
      });
      const res = await onRequestPost({ request: makeReq('{}'), env: ENV });
      expect(res.status).toBe(200);
      expect(mockSendMerchantNotification).not.toHaveBeenCalled();
    });

    it('returns 200 and calls sendMerchantNotification for checkout.session.completed', async () => {
      mockConstructEventAsync.mockResolvedValue({
        type: 'checkout.session.completed',
        data: { object: COMPLETED_SESSION },
      });
      mockSendMerchantNotification.mockResolvedValue({ ok: true });

      const res = await onRequestPost({ request: makeReq('{}'), env: ENV });
      expect(res.status).toBe(200);
      expect(mockSendMerchantNotification).toHaveBeenCalledOnce();

      const [apiKey, order] = mockSendMerchantNotification.mock.calls[0];
      expect(apiKey).toBe('re_test_xxx');
      expect(order.orderRef).toBe('cs_live_abc123');
      expect(order.sku).toBe('A4-10K');
      expect(order.amountPence).toBe(42500);
      expect(order.restaurantName).toBe("Tony's Pizza");
      expect(order.notes).toBe('Double-sided');
      expect(order.customerEmail).toBe('customer@example.com');
    });

    it('returns 200 even when email sending fails (Stripe must not retry)', async () => {
      mockConstructEventAsync.mockResolvedValue({
        type: 'checkout.session.completed',
        data: { object: COMPLETED_SESSION },
      });
      mockSendMerchantNotification.mockResolvedValue({ ok: false, error: 'Resend 500' });

      const res = await onRequestPost({ request: makeReq('{}'), env: ENV });
      expect(res.status).toBe(200);
    });

    it('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
      const res = await onRequestPost({
        request: makeReq('{}'),
        env: { ...ENV, STRIPE_WEBHOOK_SECRET: '' },
      });
      expect(res.status).toBe(500);
    });
  });
  ```

- [ ] **Step 2: Run test to verify it fails**

  ```bash
  npx vitest run tests/unit/api/stripe-webhook.test.js
  ```

  Expected: FAIL — `Cannot find module '../../../functions/api/stripe-webhook.js'`

- [ ] **Step 3: Implement `functions/api/stripe-webhook.js`**

  ```javascript
  import { createStripeClient } from '../lib/stripe.js';
  import { sendMerchantNotification } from '../lib/email.js';

  function json(status, body) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Extract a custom field value by key from the Stripe session's custom_fields array.
   */
  function getCustomField(fields, key) {
    return fields?.find(f => f.key === key)?.text?.value ?? '';
  }

  export async function onRequestPost(context) {
    const { request, env } = context;

    // Env check — fail fast, opaque 500.
    if (!env?.STRIPE_SECRET_KEY || !env?.STRIPE_WEBHOOK_SECRET || !env?.RESEND_API_KEY) {
      return json(500, { error: 'misconfigured' });
    }

    // Stripe signature must be present.
    const sig = request.headers.get('stripe-signature');
    if (!sig) {
      return json(400, { error: 'missing signature' });
    }

    // Read raw body — required for signature verification.
    const payload = await request.text();

    // Verify signature using Web Crypto-compatible async method.
    let event;
    try {
      const stripe = createStripeClient(env);
      event = await stripe.webhooks.constructEventAsync(
        payload,
        sig,
        env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      return json(400, { error: 'invalid signature' });
    }

    // Only handle checkout.session.completed — acknowledge all others.
    if (event.type !== 'checkout.session.completed') {
      return json(200, { received: true });
    }

    const session = event.data.object;

    const order = {
      orderRef: session.id,
      sku: session.metadata?.sku ?? 'unknown',
      amountPence: session.amount_total ?? 0,
      restaurantName: getCustomField(session.custom_fields, 'restaurantname'),
      notes: getCustomField(session.custom_fields, 'notes'),
      customerName: session.customer_details?.name ?? '',
      customerEmail: session.customer_details?.email ?? '',
      customerPhone: session.customer_details?.phone ?? '',
      shippingAddress: session.shipping_details?.address ?? null,
    };

    // Send merchant notification — never fail the webhook on email error.
    // Stripe retries on non-200 responses; a 200 here means "received, handled".
    const emailResult = await sendMerchantNotification(env.RESEND_API_KEY, order);
    if (!emailResult.ok) {
      console.error('[webhook] email failed:', emailResult.error);
    }

    return json(200, { received: true });
  }
  ```

- [ ] **Step 4: Run all tests**

  ```bash
  npx vitest run
  ```

  Expected: all tests pass (including existing checkout-session and checkout-status tests).

- [ ] **Step 5: Commit**

  ```bash
  git add functions/api/stripe-webhook.js tests/unit/api/stripe-webhook.test.js
  git commit -m "feat: add Stripe webhook handler with Resend merchant notification email"
  ```

---

## Task 3: Register webhook in Stripe Dashboard + push env vars (USER ACTION + code)

- [ ] **Step 1: Register the webhook in Stripe Dashboard**

  Go to [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**:
  - Endpoint URL: `https://printmenu.co.uk/api/stripe-webhook`
  - Events to listen for: `checkout.session.completed`
  - Click **Add endpoint**

- [ ] **Step 2: Copy the webhook signing secret**

  After creating the webhook, click on it → **Reveal signing secret** → copy the `whsec_...` value.

- [ ] **Step 3: Update .dev.vars**

  Replace the placeholder in `.dev.vars`:
  ```
  STRIPE_WEBHOOK_SECRET=whsec_YOUR_REAL_SECRET_HERE
  RESEND_API_KEY=re_YOUR_KEY_HERE
  ```

- [ ] **Step 4: Push env vars to CF Pages via API**

  Run the CF API PATCH (same pattern used earlier in the project):

  ```bash
  TOKEN=$(cat ~/Library/Preferences/.wrangler/config/default.toml | grep oauth_token | cut -d'"' -f2)
  ACCOUNT_ID="e7cc4b9280da240c8c4bf64ac74dd909"
  PROJECT="print-menu"

  curl -s -X PATCH \
    "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects/$PROJECT" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"deployment_configs\": {
        \"production\": {
          \"env_vars\": {
            \"STRIPE_SECRET_KEY\": { \"value\": \"$(grep STRIPE_SECRET_KEY .dev.vars | cut -d= -f2)\" },
            \"STRIPE_WEBHOOK_SECRET\": { \"value\": \"$(grep STRIPE_WEBHOOK_SECRET .dev.vars | cut -d= -f2)\" },
            \"RESEND_API_KEY\": { \"value\": \"$(grep RESEND_API_KEY .dev.vars | cut -d= -f2)\" },
            \"SITE_URL\": { \"value\": \"https://printmenu.co.uk\" }
          }
        }
      }
    }" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('success') else d)"
  ```

  Expected output: `OK`

- [ ] **Step 5: Push the code and wait for deploy**

  ```bash
  git push
  ```

  Wait ~60 seconds for CF Pages to deploy.

- [ ] **Step 6: Smoke test the live webhook**

  In Stripe Dashboard → Webhooks → click your endpoint → **Send test event** → select `checkout.session.completed` → Send.

  Check `hello@printmenu.co.uk` — a test order email should arrive within 30 seconds.

  Then make a real purchase on printmenu.co.uk and verify the email contains correct order details.

---

## Self-Review

**Spec coverage:**
- ✅ Merchant email sent on every completed checkout
- ✅ Email contains: order ref, SKU, amount, restaurant name, notes, customer email/phone/address
- ✅ Stripe signature verified — no spoofed events
- ✅ Webhook always returns 200 — email failures don't cause Stripe retries
- ✅ Env vars gated at startup — opaque 500 if misconfigured
- ✅ Domain-verified sender address (`orders@printmenu.co.uk`)
- ✅ Unit tests cover: missing sig, bad sig, ignored event, success, email failure, missing env

**Placeholder scan:** None found.

**Type consistency:** `order` object shape matches exactly between `stripe-webhook.js` (producer) and `email.js` (consumer) and tests.
