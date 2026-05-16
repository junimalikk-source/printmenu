import { test, expect } from '@playwright/test';

test('gallery shows 3 images with descriptive alt text and lazy loading', async ({ page }) => {
  await page.goto('/');
  const imgs = page.locator('#gallery .gallery-item img');
  await expect(imgs).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    const alt = await imgs.nth(i).getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt.length).toBeGreaterThan(3);
    expect(await imgs.nth(i).getAttribute('loading')).toBe('lazy');
  }
});
