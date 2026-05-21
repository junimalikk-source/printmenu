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
    // Regression: must link to /checkout/sessions/ not /payments/ (cs_ IDs don't work at /payments/)
    expect(body.html).toContain('dashboard.stripe.com/checkout/sessions/cs_live_abc123');
    expect(body.html).not.toContain('dashboard.stripe.com/payments/cs_live_abc123');

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
