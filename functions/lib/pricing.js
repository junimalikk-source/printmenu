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
