import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock the stripe module BEFORE importing the route handler ---
// vi.hoisted is required so the mock fn exists at the moment the
// hoisted vi.mock factory runs (Vitest 4 hoists vi.mock above imports).
const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }));
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

  it('rejects body over 1KB even without Content-Length header', async () => {
    // Build an oversized body and strip Content-Length to confirm the
    // server enforces the cap by actually reading bytes, not header trust.
    const oversized = { size: 'A4', qty: '20K', attempt_id: UUID, junk: 'x'.repeat(2048) };
    const json = JSON.stringify(oversized);
    const req = new Request('https://printmenu.co.uk/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://printmenu.co.uk',
      },
      body: json,
    });
    const res = await onRequestPost({ request: req, env: ENV });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
