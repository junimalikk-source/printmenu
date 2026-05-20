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
