const MERCHANT_EMAIL = 'hello@printmenu.co.uk';
const FROM_ADDRESS = 'Print Menu Orders <orders@printmenu.co.uk>';
const RESEND_API = 'https://api.resend.com/emails';

function formatGBP(pence) {
  return '£' + (pence / 100).toFixed(2);
}

function formatAddress(addr) {
  if (!addr) return 'Not provided';
  return [addr.line1, addr.line2, addr.city, addr.postal_code, addr.country]
    .filter(Boolean)
    .join(', ');
}

function buildHtml(order) {
  const {
    orderRef, sku, amountPence, restaurantName, notes,
    customerName, customerEmail, customerPhone, shippingAddress,
  } = order;

  const amount = formatGBP(amountPence);
  const address = formatAddress(shippingAddress);
  const notesText = notes?.trim() || 'None';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>New Order</title></head>
<body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#1a1a2e;font-size:22px;margin-bottom:4px">New order received</h1>
  <p style="color:#555;margin-top:0">printmenu.co.uk</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">

  <table style="width:100%;border-collapse:collapse;font-size:15px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Order reference</td>
        <td style="padding:8px 0;font-weight:600">${orderRef}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Product (SKU)</td>
        <td style="padding:8px 0;font-weight:600">${sku}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Amount paid</td>
        <td style="padding:8px 0;font-weight:600">${amount}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Restaurant / business</td>
        <td style="padding:8px 0;font-weight:600">${restaurantName}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Notes</td>
        <td style="padding:8px 0">${notesText}</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
  <h2 style="font-size:16px;margin-bottom:8px">Customer details</h2>
  <table style="width:100%;border-collapse:collapse;font-size:15px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Name</td>
        <td style="padding:8px 0">${customerName || 'Not provided'}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Email</td>
        <td style="padding:8px 0"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
    <tr><td style="padding:8px 0;color:#555">Phone</td>
        <td style="padding:8px 0">${customerPhone || 'Not provided'}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Delivery address</td>
        <td style="padding:8px 0">${address}</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
  <p style="background:#f5f5f5;padding:12px;border-radius:6px;font-size:14px">
    <strong>Next step:</strong> Email the customer at
    <a href="mailto:${customerEmail}">${customerEmail}</a> to request their artwork files.
  </p>

  <p style="font-size:12px;color:#999;margin-top:24px">
    View in Stripe Dashboard:
    <a href="https://dashboard.stripe.com/checkout/sessions/${orderRef}">
      https://dashboard.stripe.com/checkout/sessions/${orderRef}
    </a>
  </p>
</body>
</html>`;
}

function buildCustomerHtml(order) {
  const {
    orderRef, sku, amountPence, restaurantName, notes,
    customerName, shippingAddress,
  } = order;

  const amount = formatGBP(amountPence);
  const address = formatAddress(shippingAddress);
  const notesText = notes?.trim() || 'None';
  const firstName = customerName?.split(' ')[0] || 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Order Confirmed</title></head>
<body style="font-family:sans-serif;color:#222;max-width:600px;margin:0 auto;padding:24px">
  <h1 style="color:#1a1a2e;font-size:22px;margin-bottom:4px">Your order is confirmed</h1>
  <p style="color:#555;margin-top:0">Hi ${firstName}, thank you for your order from <strong>Print Menu</strong>.</p>
  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">

  <table style="width:100%;border-collapse:collapse;font-size:15px">
    <tr><td style="padding:8px 0;color:#555;width:40%">Order reference</td>
        <td style="padding:8px 0;font-weight:600">${orderRef}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Product</td>
        <td style="padding:8px 0;font-weight:600">${sku}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Amount paid</td>
        <td style="padding:8px 0;font-weight:600">${amount}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Business name</td>
        <td style="padding:8px 0">${restaurantName}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Notes</td>
        <td style="padding:8px 0">${notesText}</td></tr>
    <tr><td style="padding:8px 0;color:#555">Delivery address</td>
        <td style="padding:8px 0">${address}</td></tr>
  </table>

  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">

  <h2 style="font-size:17px;margin-bottom:8px">What happens next?</h2>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px">
    <strong>1. Send us your artwork</strong><br>
    Email your artwork files to
    <a href="mailto:hello@printmenu.co.uk">hello@printmenu.co.uk</a>
    with your order reference <strong>${orderRef}</strong> in the subject line.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px">
    <strong>2. We check and approve</strong><br>
    We'll review your artwork and confirm it's print-ready. If anything needs adjusting we'll let you know.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 12px">
    <strong>3. Printed and delivered</strong><br>
    Once artwork is approved, your menus are printed and delivered within 3–5 working days.
  </p>

  <hr style="border:none;border-top:1px solid #e0e0e0;margin:16px 0">
  <p style="font-size:14px;color:#555">
    Questions? Email us at <a href="mailto:hello@printmenu.co.uk">hello@printmenu.co.uk</a>
  </p>
  <p style="font-size:12px;color:#999;margin-top:24px">
    Print Menu · printmenu.co.uk
  </p>
</body>
</html>`;
}

/**
 * Send a branded order confirmation email to the customer via Resend.
 */
export async function sendCustomerConfirmation(apiKey, order) {
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [order.customerEmail],
        subject: `Your Print Menu order is confirmed – ${order.sku} (${order.orderRef})`,
        html: buildCustomerHtml(order),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: `Resend ${res.status}: ${body.message ?? 'unknown'}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

export async function sendMerchantNotification(apiKey, order) {
  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [MERCHANT_EMAIL],
        subject: `New order: ${order.sku} – ${order.restaurantName} (${order.orderRef})`,
        html: buildHtml(order),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: `Resend ${res.status}: ${body.message ?? 'unknown'}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}
