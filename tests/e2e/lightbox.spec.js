import { test, expect } from '@playwright/test';

test.describe('lightbox', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('clicking a gallery item opens the lightbox', async ({ page }) => {
    const lb = page.locator('#lightbox');
    await expect(lb).toBeHidden();
    await page.locator('#gallery .gallery-item').first().click();
    await expect(lb).toBeVisible();
    await expect(lb.locator('img')).toHaveAttribute('src', /menu-placeholder-1/);
  });

  test('Escape closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('clicking the backdrop closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().click();
    await page.locator('#lightbox').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});
