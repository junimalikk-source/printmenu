import { test, expect } from '@playwright/test';

test.describe('quote form', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('has all required fields with labels', async ({ page }) => {
    const form = page.locator('#quote-form');
    await expect(form.locator('label[for="qf-name"]')).toBeVisible();
    await expect(form.locator('#qf-name')).toHaveAttribute('required', '');
    await expect(form.locator('#qf-phone')).toHaveAttribute('required', '');
    await expect(form.locator('select[name="size"]')).toBeVisible();
    await expect(form.locator('select[name="quantity"]')).toBeVisible();
    await expect(form.locator('textarea[name="notes"]')).toBeVisible();
  });

  test('honeypot field exists and is visually hidden', async ({ page }) => {
    const honey = page.locator('#quote-form [name="company_website"]');
    await expect(honey).toHaveCount(1);
    const visible = await honey.evaluate(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
    expect(visible).toBe(false);
  });

  test('phone/whatsapp fallback links are present', async ({ page }) => {
    await expect(page.locator('#quote a[href="tel:01274305555"]')).toBeVisible();
    await expect(page.locator('#quote a[href^="https://wa.me/"]')).toBeVisible();
  });

  test('blocks submission when phone is invalid', async ({ page }) => {
    await page.goto('/');
    await page.locator('#qf-name').fill('Mo');
    await page.locator('#qf-phone').fill('abc123');
    await page.locator('#qf-size').selectOption('A4');
    await page.locator('#qf-qty').selectOption('10K');
    await page.locator('#quote-form button[type=submit]').click();
    const status = page.locator('#quote-form .qf-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveClass(/is-error/);
    await expect(status).toContainText(/phone/i);
  });

  test('shows success state on valid submit (mocked Formspree response)', async ({ page }) => {
    await page.route('https://formspree.io/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
    );
    await page.goto('/');
    await page.locator('#qf-name').fill('Mo');
    await page.locator('#qf-phone').fill('07572 574582');
    await page.locator('#qf-size').selectOption('A4');
    await page.locator('#qf-qty').selectOption('20K');
    await page.locator('#quote-form button[type=submit]').click();
    await expect(page.locator('#quote-form .qf-status')).toHaveClass(/is-success/);
    await expect(page.locator('#quote-form .qf-status')).toContainText(/within 1 working hour/i);
  });

  test('silently rejects honeypot-filled submissions', async ({ page }) => {
    let networkCalled = false;
    await page.route('https://formspree.io/**', route => { networkCalled = true; route.fulfill({ status: 200, body: '{}' }); });
    await page.goto('/');
    await page.locator('#qf-name').fill('Bot');
    await page.locator('#qf-phone').fill('07572574582');
    await page.locator('#qf-size').selectOption('A4');
    await page.locator('#qf-qty').selectOption('10K');
    await page.locator('#quote-form [name="company_website"]').evaluate(el => el.value = 'spam');
    await page.locator('#quote-form button[type=submit]').click();
    // Honeypot path shows "success" UX but does NOT call Formspree
    await page.waitForTimeout(200);
    expect(networkCalled).toBe(false);
  });
});
