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

  // Guard against unpaid sessions (e.g. free checkouts, certain redirect flows).
  if (session.payment_status !== 'paid') {
    console.warn('[webhook] session completed but payment_status:', session.payment_status);
    return json(200, { received: true });
  }

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
  const emailResult = await sendMerchantNotification(env.RESEND_API_KEY, order);
  if (!emailResult.ok) {
    console.error('[webhook] email failed:', emailResult.error);
  }

  return json(200, { received: true });
}
