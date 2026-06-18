import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => { await page.goto('/'); });

test('hero shows headline, subhead, and two CTAs', async ({ page }) => {
  const hero = page.locator('#hero');
  await expect(hero).toContainText("UK's most affordable takeaway menu printer");
  await expect(hero.locator('h1')).toContainText('Takeaway Menu Printing');
  await expect(hero).toContainText('10,000 A4 menus');
  await expect(hero).toContainText('£425');
  await expect(hero.getByRole('link', { name: /order online/i })).toBeVisible();
  const waLink = hero.locator('a[href^="https://wa.me/"]');
  await expect(waLink).toContainText(/whatsapp/i);
});

test('whatsapp link uses the configured number', async ({ page }) => {
  const href = await page.locator('#hero a[href^="https://wa.me/"]').first().getAttribute('href');
  expect(href).toBe('https://wa.me/447488279811');
});
