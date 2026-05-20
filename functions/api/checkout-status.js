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

  // Soft origin check.
  // Exact origin match (no startsWith — that accepts spoofed suffixes
  // like https://printmenu.co.uk.evil.example). Fall back to Referer
  // if Origin is absent. If neither is present, accept (legitimate
  // first-party navigations sometimes drop both).
  let expectedOrigin;
  try { expectedOrigin = new URL(env.SITE_URL).origin; } catch { expectedOrigin = env.SITE_URL; }
  const originHdr = request.headers.get('Origin');
  if (originHdr) {
    if (originHdr !== expectedOrigin) {
      return json(400, { error: 'bad request' });
    }
  } else {
    const referer = request.headers.get('Referer');
    if (referer) {
      let refOrigin;
      try { refOrigin = new URL(referer).origin; } catch { refOrigin = null; }
      if (refOrigin !== expectedOrigin) {
        return json(400, { error: 'bad request' });
      }
    }
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
