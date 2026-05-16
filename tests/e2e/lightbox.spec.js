import { test, expect } from '@playwright/test';

test.describe('lightbox', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Pause the gallery marquee so the click target is stable in both projects.
    await page.evaluate(() => {
      const track = document.querySelector('#gallery .gallery-track');
      if (track) track.style.animation = 'none';
    });
  });

  test('clicking a gallery item opens the lightbox', async ({ page }) => {
    const lb = page.locator('#lightbox');
    await expect(lb).toBeHidden();
    await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
    await page.locator('#gallery .gallery-item').first().click({ force: true });
    await expect(lb).toBeVisible();
    await expect(lb.locator('img')).toHaveAttribute('src', /menu-pizza/);
  });

  test('Escape closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
    await page.locator('#gallery .gallery-item').first().click({ force: true });
    await expect(page.locator('#lightbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).toBeHidden();
  });

  test('clicking the backdrop closes the lightbox', async ({ page }) => {
    await page.locator('#gallery .gallery-item').first().scrollIntoViewIfNeeded();
    await page.locator('#gallery .gallery-item').first().click({ force: true });
    await page.locator('#lightbox').click({ position: { x: 5, y: 5 } });
    await expect(page.locator('#lightbox')).toBeHidden();
  });
});
