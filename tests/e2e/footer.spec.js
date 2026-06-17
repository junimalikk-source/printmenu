import { test, expect } from '@playwright/test';

test('footer shows contact details and legal links', async ({ page }) => {
  await page.goto('/');
  const footer = page.locator('#site-footer');
  await expect(footer).toContainText('Based in Bradford');
  await expect(footer.locator('a[href="tel:+447488279811"]')).toBeVisible();
  await expect(footer.locator('a[href^="https://wa.me/"]')).toBeVisible();
  await expect(footer.locator('a[href$="/privacy"]')).toBeVisible();
  await expect(footer.locator('a[href$="/terms"]')).toBeVisible();
});

test('privacy and terms pages load', async ({ page }) => {
  await page.goto('/privacy.html');
  await expect(page.locator('h1')).toContainText(/privacy/i);
  await page.goto('/terms.html');
  await expect(page.locator('h1')).toContainText(/terms/i);
});
