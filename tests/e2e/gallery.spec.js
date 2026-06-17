import { test, expect } from '@playwright/test';

test('gallery shows 6 images with descriptive alt text and lazy loading', async ({ page }) => {
  await page.goto('/');
  // Marquee duplicates items at runtime for a seamless loop; clones are aria-hidden.
  const imgs = page.locator('#gallery .gallery-item:not([data-clone]) img');
  await expect(imgs).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt.length).toBeGreaterThan(3);
    expect(await imgs.nth(i).getAttribute('loading')).toBe('lazy');
  }
});
