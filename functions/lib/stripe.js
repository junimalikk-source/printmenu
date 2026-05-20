import Stripe from 'stripe';

/**
 * Create a Stripe client suitable for the Cloudflare Pages Functions runtime.
 * Uses the fetch-based HTTP client (the Node http client is unavailable here).
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export function createStripeClient(env) {
  if (!env?.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }
  return new Stripe(env.STRIPE_SECRET_KEY, {
    httpClient: Stripe.createFetchHttpClient(),
    // Intentionally omit apiVersion — let the SDK use its release-pinned
    // version (current Stripe-node best practice for new code; pin only
    // when you need to lock against a specific behaviour change).
  });
}
