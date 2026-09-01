import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PATH = '/admin/whatsapp-quote.html';

test.beforeEach(async ({ page }) => {
  await page.goto(PATH);
});

test('starts on the full quote with placeholders and a blocked send', async ({ page }) => {
  await expect(page.locator('#wq-template')).toHaveValue('full');

  const preview = page.locator('#wq-preview');
  await expect(preview).toContainText('[Name]');
  await expect(preview).toContainText('£[amount]');
  await expect(preview).toContainText('https://pay.vivawallet.com/printplus-uk-ltd');

  await expect(page.locator('#wq-missing')).toContainText('customer name, item, total');
  await expect(page.locator('#wq-open')).toHaveAttribute('aria-disabled', 'true');
});

test('a filled quote produces a wa.me link carrying the whole message', async ({ page }) => {
  await page.fill('#wq-name', 'Ali');
  await page.fill('#wq-item', '5,000 × A5 menus');
  await page.fill('#wq-amount', '450');
  await page.fill('#wq-phone', '07700 900123');

  const preview = page.locator('#wq-preview');
  await expect(preview).toContainText("Hi Ali, thanks for your order!");
  await expect(preview).toContainText('💷 TOTAL: £450 (incl. VAT, delivery)');

  await expect(page.locator('#wq-missing')).toBeHidden();
  await expect(page.locator('#wq-open')).toHaveAttribute('aria-disabled', 'false');
  await expect(page.locator('#wq-phone-hint')).toContainText('+447700900123');

  const href = await page.locator('#wq-open').getAttribute('href');
  expect(href.startsWith('https://wa.me/447700900123?text=')).toBe(true);

  const message = decodeURIComponent(href.split('?text=')[1]);
  expect(message).toBe(await preview.textContent());
  expect(message).toContain('https://pay.vivawallet.com/printplus-uk-ltd');
});

test('quick-fill copies the price-list item and total into the message', async ({ page }) => {
  await page.fill('#wq-name', 'Ali');
  await page.selectOption('#wq-sku', 'A4-20K');

  await expect(page.locator('#wq-item')).toHaveValue('20,000 × A4 menus');
  await expect(page.locator('#wq-amount')).toHaveValue('550');
  await expect(page.locator('#wq-preview')).toContainText('💷 TOTAL: £550');
});

test('the tone selector swaps opener and closer', async ({ page }) => {
  await page.fill('#wq-name', 'Ali');
  await page.selectOption('#wq-tone', 'formal');

  const preview = page.locator('#wq-preview');
  await expect(preview).toContainText('Dear Ali, thank you for your enquiry');
  await expect(preview).toContainText('Kind regards, PrintMenu.co.uk');
});

test('switching template swaps the visible fields', async ({ page }) => {
  await page.selectOption('#wq-template', 'paid');

  await expect(page.locator('#wq-item')).toBeHidden();
  await expect(page.locator('#wq-amount')).toBeHidden();
  await expect(page.locator('#wq-tone')).toBeHidden();
  await expect(page.locator('#wq-proof-by')).toBeVisible();

  await page.fill('#wq-name', 'Ali');
  await page.fill('#wq-proof-by', 'Thursday 5pm');

  const preview = page.locator('#wq-preview');
  await expect(preview).toContainText('Payment received ✅ Thanks Ali!');
  await expect(preview).not.toContainText('pay.vivawallet.com');
  await expect(page.locator('#wq-missing')).toBeHidden();
});

test('a custom payment link replaces the default', async ({ page }) => {
  await page.fill('#wq-name', 'Ali');
  await page.fill('#wq-item', '5,000 × A5 menus');
  await page.fill('#wq-amount', '450');
  await page.fill('#wq-payment-link', 'https://buy.stripe.com/test_123');

  const preview = page.locator('#wq-preview');
  await expect(preview).toContainText('https://buy.stripe.com/test_123');
  await expect(preview).not.toContainText('pay.vivawallet.com');
});

test('an amount that is not a number blocks the send', async ({ page }) => {
  await page.fill('#wq-name', 'Ali');
  await page.fill('#wq-item', '5,000 × A5 menus');
  await page.fill('#wq-amount', 'about four hundred');

  await expect(page.locator('#wq-missing')).toContainText('total');
  await expect(page.locator('#wq-open')).toBeDisabled();

  // force: the aria-disabled state is exactly what makes this un-clickable to
  // Playwright — click through it to prove the JS guard blocks the send too.
  await page.locator('#wq-open').click({ force: true });
  await expect(page.locator('#wq-status')).toContainText('Fill in the highlighted fields');
});

test('the page is not indexable', async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
});

test('axe-core finds no serious or critical violations', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Same brand exception as the public pages: WhatsApp green (#25D366) with
  // white text is below AA contrast, and we keep the recognisable brand colour.
  const violations = results.violations
    .map(v => v.id !== 'color-contrast' ? v : {
      ...v,
      nodes: v.nodes.filter(n => !String(n.html).includes('btn-whatsapp')),
    })
    .filter(v => v.nodes.length > 0);

  const serious = violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) {
    console.error('A11y violations:', JSON.stringify(serious, null, 2));
  }
  expect(serious).toEqual([]);
});
