import { test, expect } from '@playwright/test';

test('gallery shows 6 images with descriptive alt text and lazy loading', async ({ page }) => {
  await page.goto('/');
  const imgs = page.locator('#gallery .gallery-item img');
  await expect(imgs).toHaveCount(6);
  for (let i = 0; i < 6; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt.length).toBeGreaterThan(3);
    expect(await imgs.nth(i).getAttribute('loading')).toBe('lazy');
  }
});
