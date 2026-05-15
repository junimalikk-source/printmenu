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
});
