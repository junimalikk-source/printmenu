import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted is required for Vitest 4's hoisted vi.mock factories.
const { mockRetrieve } = vi.hoisted(() => ({ mockRetrieve: vi.fn() }));
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

function makeReqNoOrigin(qs = '', opts = {}) {
  const headers = {};
  if (opts.referer) headers.Referer = opts.referer;
  return new Request(`https://printmenu.co.uk/api/checkout-status${qs}`, {
    method: 'GET',
    headers,
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

  it('rejects suffix-spoofed Origin (regression for startsWith bug)', async () => {
    const res = await onRequestGet({
      request: makeReq(
        `?session_id=${VALID_SESSION_ID}`,
        { origin: 'https://printmenu.co.uk.evil.example' }
      ),
      env: ENV,
    });
    expect(res.status).toBe(400);
  });

  it('accepts when both Origin and Referer are absent (first-party nav)', async () => {
    mockRetrieve.mockResolvedValue({
      id: VALID_SESSION_ID,
      payment_status: 'paid',
      amount_total: 55000,
      customer_details: { email: 'a@b.co' },
      custom_fields: [],
      metadata: { sku: 'A4-20K' },
    });
    const res = await onRequestGet({
      request: makeReqNoOrigin(`?session_id=${VALID_SESSION_ID}`),
      env: ENV,
    });
    expect(res.status).toBe(200);
  });

  it('rejects suffix-spoofed Referer (Referer fallback regression)', async () => {
    const res = await onRequestGet({
      request: makeReqNoOrigin(`?session_id=${VALID_SESSION_ID}`, {
        referer: 'https://printmenu.co.uk.evil.example/some/path',
      }),
      env: ENV,
    });
    expect(res.status).toBe(400);
    expect(mockRetrieve).not.toHaveBeenCalled();
  });
});
