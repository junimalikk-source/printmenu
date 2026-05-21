# Stripe Checkout — Launch Runbook

## Pre-launch checklist

### Cloudflare Pages dashboard (printmenu-co-uk project)
- [ ] Production environment variable: `STRIPE_SECRET_KEY=sk_live_…`
- [ ] Production environment variable: `SITE_URL=https://printmenu.co.uk`
- [ ] Preview environment variable: `STRIPE_SECRET_KEY=sk_test_…`
- [ ] Preview environment variable: `SITE_URL` = preview branch URL (or test domain)
- [ ] Confirm `_routes.json` is in the deployed build output

### Stripe Dashboard (live mode)
- [ ] Branding: upload PrintMenu logo, set primary colour `#11295A`, accent `#06B5E2`
- [ ] Business profile: address, support email = `hello@printmenu.co.uk`, support phone `01274 305555`
- [ ] Receipt emails: enabled for "Successful payments"
- [ ] Email notifications to merchant (`hello@printmenu.co.uk`):
  - [ ] Successful payments
  - [ ] Failed payments
  - [ ] Refunds
  - [ ] Disputes
- [ ] Card payments: enabled (UK, GBP)
- [ ] Apple Pay + Google Pay: enabled (Stripe handles domain verification automatically once first prod deploy is live)
- [ ] VAT note in business profile: "Printed menus zero-rated under VAT Notice 701/10"

### Smoke test on production (smallest order: A5/10K = £200, then refund)
- [ ] Buy one A5/10K order with a real card (£200) → confirm receipt arrives at customer inbox
- [ ] Confirm merchant notification arrives at `hello@printmenu.co.uk`
- [ ] Confirm order ref + custom-field "restaurantname" + metadata visible in Stripe Dashboard
- [ ] Issue full refund from Stripe Dashboard → confirm refund notification arrives

## Daily ops (post-launch)

1. Open Stripe Dashboard once per working day.
2. Cross-reference any new "Paid" payments in the last 24h against incoming `hello@printmenu.co.uk` artwork emails.
3. For any paid order with no artwork email after 24h, send a manual chase from `hello@printmenu.co.uk` quoting the Stripe order ref (`cs_live_…`).
4. Handle refunds, chargebacks, disputes manually in the Stripe Dashboard.

## If the Stripe key leaks

1. Roll `STRIPE_SECRET_KEY` in the Stripe Dashboard → Developers → API keys.
2. Update the Cloudflare Pages production env var to the new key.
3. Trigger a new deploy (push any empty commit, or hit "Retry deployment" in CF Pages).
4. Confirm `/api/create-checkout-session` works with a new test purchase.

## When to upgrade to v1.1 (add webhook)

Trigger if **any** of these become true:
- More than ~10 orders/day (manual reconciliation no longer scales).
- More than 1 paid-but-no-artwork chase needed per week.
- Need to export orders to a spreadsheet / accounting tool.
- Need to send a reminder email automatically.
