import { test, expect } from '@playwright/test';

test.describe('top nav', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('shows logo and the call-us button', async ({ page }) => {
    await expect(page.locator('.nav-logo')).toContainText(/cheapestprint/i);
    await expect(page.locator('a.nav-call')).toContainText('01274 305555');
  });

  test('desktop links include all anchors', async ({ page, viewport }) => {
    test.skip(viewport.width < 960, 'desktop-only links');
    const hrefs = await page.locator('.nav-links a').evaluateAll(
      els => els.map(e => e.getAttribute('href'))
    );
    expect(hrefs).toEqual(['#pricing', '#how-it-works', '#reviews', '#quote']);
  });
});
