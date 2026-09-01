import { describe, it, expect } from 'vitest';
import {
  BRAND,
  PAYMENT_LINK,
  SKUS,
  TEMPLATES,
  TONES,
  formatAmount,
  normaliseWhatsAppNumber,
  renderMessage,
  requiredFields,
  buildWhatsAppUrl,
} from '../../assets/whatsapp-templates.js';
import { PRICES } from '../../functions/lib/pricing.js';

const QUOTE = {
  name: 'Ali',
  item: '5,000 × A5 menus',
  amount: '450',
  spec: 'double-sided, full colour, 130gsm gloss',
};

describe('formatAmount', () => {
  it('drops pence when the amount is whole', () => {
    expect(formatAmount(450)).toBe('450');
  });

  it('keeps two decimals when there are pence', () => {
    expect(formatAmount(1250.5)).toBe('1,250.50');
  });

  it('separates thousands', () => {
    expect(formatAmount(160000)).toBe('160,000');
  });

  it('accepts a typed string with £ and commas', () => {
    expect(formatAmount('£1,250')).toBe('1,250');
  });

  it('returns empty for junk or negatives', () => {
    expect(formatAmount('abc')).toBe('');
    expect(formatAmount('')).toBe('');
    expect(formatAmount(-5)).toBe('');
    expect(formatAmount(null)).toBe('');
  });
});

describe('normaliseWhatsAppNumber', () => {
  it.each([
    ['07488 279811', '447488279811'],
    ['+44 7488 279811', '447488279811'],
    ['+44 (0)7488 279811', '447488279811'],
    ['00447488279811', '447488279811'],
    ['44 7488 279811', '447488279811'],
    ['7488279811', '447488279811'],
  ])('normalises UK number %s', (input, expected) => {
    expect(normaliseWhatsAppNumber(input)).toBe(expected);
  });

  it('leaves an already-international number alone', () => {
    expect(normaliseWhatsAppNumber('353871234567')).toBe('353871234567');
    expect(normaliseWhatsAppNumber('+1 415 555 2671')).toBe('14155552671');
  });

  it('returns null for anything that cannot be a number', () => {
    expect(normaliseWhatsAppNumber('')).toBeNull();
    expect(normaliseWhatsAppNumber('   ')).toBeNull();
    expect(normaliseWhatsAppNumber('not a phone')).toBeNull();
    expect(normaliseWhatsAppNumber('12345')).toBeNull();          // too short
    expect(normaliseWhatsAppNumber('1234567890123456')).toBeNull(); // too long
    expect(normaliseWhatsAppNumber(null)).toBeNull();
    expect(normaliseWhatsAppNumber(undefined)).toBeNull();
  });
});

describe('renderMessage — full quote', () => {
  it('includes the summary, total, payment link and next steps', () => {
    const { text, missing } = renderMessage('full', QUOTE);
    expect(missing).toEqual([]);
    expect(text).toContain('Hi Ali, thanks for your order!');
    expect(text).toContain('• Item: 5,000 × A5 menus');
    expect(text).toContain('• Spec: double-sided, full colour, 130gsm gloss');
    expect(text).toContain('💷 TOTAL: £450 (incl. VAT, delivery)');
    expect(text).toContain(PAYMENT_LINK);
    expect(text).toContain('design work and printing only begin after payment is confirmed');
    expect(text).toContain(`— ${BRAND}`);
  });

  it('omits optional summary lines that were left blank', () => {
    const { text } = renderMessage('full', QUOTE);
    expect(text).not.toContain('• Finish:');
    expect(text).not.toContain('• Delivery:');
    // and no blank line left behind where they would have been
    expect(text).toContain('130gsm gloss\n\n💷 TOTAL');
  });

  it('keeps optional lines that were filled in', () => {
    const { text } = renderMessage('full', { ...QUOTE, finish: 'folded', delivery: 'collection' });
    expect(text).toContain('• Finish: folded');
    expect(text).toContain('• Delivery: collection');
  });

  it('falls back to the default turnarounds', () => {
    const { text } = renderMessage('full', QUOTE);
    expect(text).toContain('design proof within 24–48 hrs');
    expect(text).toContain('delivery in 3–5 working days');
  });

  it('uses the turnarounds supplied', () => {
    const { text } = renderMessage('full', { ...QUOTE, proofTurnaround: '2 hrs', deliveryDays: '7' });
    expect(text).toContain('design proof within 2 hrs');
    expect(text).toContain('delivery in 7 working days');
  });

  it('uses a custom payment link when one is given', () => {
    const { text } = renderMessage('full', { ...QUOTE, paymentLink: 'https://buy.stripe.com/abc' });
    expect(text).toContain('https://buy.stripe.com/abc');
    expect(text).not.toContain(PAYMENT_LINK);
  });

  it.each([
    ['formal', 'Dear Ali, thank you for your enquiry', `Kind regards, ${BRAND}`],
    ['casual', "Hey Ali! 🙌 Here's the quote", `Cheers — ${BRAND} 🚀`],
  ])('swaps opener and closer for the %s tone', (tone, opener, closer) => {
    const { text } = renderMessage('full', { ...QUOTE, tone });
    expect(text).toContain(opener);
    expect(text).toContain(closer);
  });

  it('falls back to the standard tone for an unknown tone', () => {
    const { text } = renderMessage('full', { ...QUOTE, tone: 'nonsense' });
    expect(text).toContain(TONES.standard.opener('Ali'));
  });
});

describe('renderMessage — other templates', () => {
  it('renders the short quote', () => {
    const { text, missing } = renderMessage('short', QUOTE);
    expect(missing).toEqual([]);
    expect(text).toContain('Hi Ali 👋');
    expect(text).toContain('• Total: £450');
    expect(text).toContain(`Pay here: ${PAYMENT_LINK}`);
  });

  it('renders the reorder', () => {
    const { text } = renderMessage('reorder', QUOTE);
    expect(text).toContain('confirming your reorder');
    expect(text).toContain('• Same as last order: 5,000 × A5 menus');
    expect(text).toContain(`Pay: ${PAYMENT_LINK}`);
  });

  it('renders the payment-received follow-up', () => {
    const { text, missing } = renderMessage('paid', { name: 'Ali', proofBy: 'Thursday 5pm' });
    expect(missing).toEqual([]);
    expect(text).toContain('Payment received ✅ Thanks Ali!');
    expect(text).toContain("We'll send your proof by Thursday 5pm.");
    expect(text).not.toContain(PAYMENT_LINK);
  });

  it('throws on an unknown template', () => {
    expect(() => renderMessage('nope', QUOTE)).toThrow(/unknown template/i);
  });
});

describe('renderMessage — missing required fields', () => {
  it('reports every blank required field and shows a placeholder', () => {
    const { text, missing } = renderMessage('full', {});
    expect(missing).toEqual(['name', 'item', 'amount']);
    expect(text).toContain('[Name]');
    expect(text).toContain('[amount]');
  });

  it('treats whitespace-only input as missing', () => {
    const { missing } = renderMessage('full', { ...QUOTE, name: '   ' });
    expect(missing).toEqual(['name']);
  });

  it('treats an unparseable amount as missing, not as a sendable message', () => {
    const { text, missing } = renderMessage('short', { ...QUOTE, amount: 'about four hundred' });
    expect(missing).toEqual(['amount']);
    expect(text).toContain('£[amount]');
  });

  it('accepts a zero total', () => {
    const { text, missing } = renderMessage('short', { ...QUOTE, amount: '0' });
    expect(missing).toEqual([]);
    expect(text).toContain('• Total: £0');
  });

  it('requires proofBy instead of item/amount for the follow-up', () => {
    expect(requiredFields('paid')).toEqual(['name', 'proofBy']);
    expect(renderMessage('paid', { name: 'Ali' }).missing).toEqual(['proofBy']);
  });
});

describe('buildWhatsAppUrl', () => {
  it('targets the customer when the number is usable', () => {
    const url = buildWhatsAppUrl({ phone: '07488 279811', message: 'Hi there' });
    expect(url).toBe('https://wa.me/447488279811?text=Hi%20there');
  });

  it('falls back to the contact picker without a usable number', () => {
    expect(buildWhatsAppUrl({ phone: '', message: 'Hi' })).toBe('https://wa.me/?text=Hi');
    expect(buildWhatsAppUrl({ phone: 'nope', message: 'Hi' })).toBe('https://wa.me/?text=Hi');
  });

  it('encodes newlines, emoji and the payment link intact', () => {
    const { text } = renderMessage('full', QUOTE);
    const url = buildWhatsAppUrl({ phone: '07488 279811', message: text });
    expect(url.startsWith('https://wa.me/447488279811?text=')).toBe(true);
    expect(url).not.toMatch(/\s/);
    expect(decodeURIComponent(url.split('?text=')[1])).toBe(text);
  });

  it('survives being called with nothing', () => {
    expect(buildWhatsAppUrl()).toBe('https://wa.me/?text=');
  });
});

describe('template catalogue', () => {
  it('every template id renders', () => {
    for (const t of TEMPLATES) {
      expect(() => renderMessage(t.id, QUOTE)).not.toThrow();
    }
  });

  it('marks the full quote as the only tone-aware template', () => {
    expect(TEMPLATES.filter((t) => t.tones).map((t) => t.id)).toEqual(['full']);
  });
});

describe('quick-fill SKU drift vs functions/lib/pricing.js', () => {
  const QTY_LABEL = { '10K': '10,000', '20K': '20,000', '40K': '40,000', '100K': '100,000' };

  it('every quick-fill SKU has the same price as pricing.js', () => {
    for (const entry of SKUS) {
      expect(PRICES, `unknown sku ${entry.sku}`).toHaveProperty(entry.sku);
      expect(PRICES[entry.sku].amount_pence, `price drift for ${entry.sku}`)
        .toBe(entry.amount_pence);
    }
  });

  it('every sellable pricing.js SKU is offered as a quick-fill', () => {
    for (const sku of Object.keys(PRICES)) {
      if (sku.startsWith('TEST')) continue; // dev-only SKU, never quoted
      expect(SKUS.some((s) => s.sku === sku), `no quick-fill for ${sku}`).toBe(true);
    }
  });

  it('every quick-fill label matches its SKU', () => {
    for (const entry of SKUS) {
      const [size, qty] = entry.sku.split(/-(?=\d)/);
      expect(entry.item).toBe(`${QTY_LABEL[qty]} × ${size} menus`);
    }
  });
});
