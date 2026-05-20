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

  // Fail fast on missing env — opaque 500, no key leak.
  if (!env?.STRIPE_SECRET_KEY || !env?.SITE_URL) {
    return json(500, { error: 'misconfigured' });
  }

  // Strict origin check (POST requires browser-origin match).
  // Normalise SITE_URL via URL.origin so a trailing-slash typo in the
  // dashboard doesn't 400 every legitimate request.
  let expectedOrigin;
  try { expectedOrigin = new URL(env.SITE_URL).origin; } catch { return json(500, { error: 'misconfigured' }); }
  if (request.headers.get('Origin') !== expectedOrigin) {
    return json(400, { error: 'bad request' });
  }

  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json(400, { error: 'bad request' });
  }

  // Read the body as text first so we can enforce a true byte cap.
  // Don't trust Content-Length (browsers / proxies can omit it).
  let raw;
  try {
    raw = await request.text();
  } catch {
    return json(400, { error: 'bad request' });
  }
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    return json(400, { error: 'bad request' });
  }

  let body;
  try {
    body = JSON.parse(raw);
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
        // Suppress Stripe Link wallet — "cards only" means cards only.
        wallet_options: { link: { display: 'never' } },
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
            text: { minimum_length: 2, maximum_length: 80 },
          },
          {
            key: 'notes',
            label: { type: 'custom', custom: 'Anything we should know? (optional)' },
            type: 'text',
            optional: true,
            // Stripe caps custom_fields[].text.maximum_length at 255.
            text: { maximum_length: 255 },
          },
        ],
        client_reference_id: attempt_id,
        metadata: {
          source: 'printmenu.co.uk',
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
