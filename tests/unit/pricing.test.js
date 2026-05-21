import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { PRICES, PRICE_VERSION, SALE_ENDS, lookup } from '../../functions/lib/pricing.js';

const INDEX_HTML = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), '../../index.html'),
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
      // Skip dev-only SKUs (e.g. TEST-1) — these are internal and have no HTML cell.
      if (sku.startsWith('TEST')) continue;
      // Split on the hyphen that precedes a digit (handles "A4+-20K").
      const [size, qty] = sku.split(/-(?=\d)/);
      const found = cells.some(c => c.dataset.size === size && c.dataset.qty === qty);
      expect(found, `no HTML cell for ${sku}`).toBe(true);
    }
  });
});
