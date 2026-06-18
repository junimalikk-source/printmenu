import { test, expect } from '@playwright/test';

test.describe('top nav', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('shows logo and the call-us button', async ({ page }) => {
    await expect(page.locator('.nav-logo img')).toHaveAttribute('alt', /printmenu/i);
    await expect(page.locator('a.nav-call')).toContainText('07488 279811');
  });

  test('desktop links include all anchors', async ({ page, viewport }) => {
    test.skip(viewport.width < 960, 'desktop-only links');
    const hrefs = await page.locator('.nav-links a').evaluateAll(
      els => els.map(e => e.getAttribute('href'))
    );
    for (const frag of ['#pricing', '#how-it-works', '#faq', '#quote']) {
      expect(hrefs.some(h => h && h.includes(frag))).toBe(true);
    }
  });
});

test.describe('nav behaviour', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('hamburger opens and closes overlay on mobile', async ({ page, viewport }) => {
    test.skip(viewport.width >= 960, 'mobile-only');
    const overlay = page.locator('#nav-overlay');
    await expect(overlay).toBeHidden();
    await page.locator('.nav-hamburger').click();
    await expect(overlay).toBeVisible();
    await expect(page.locator('.nav-hamburger')).toHaveAttribute('aria-expanded', 'true');
    await overlay.locator('.nav-overlay-close').click();
    await expect(overlay).toBeHidden();
  });

  test('nav gains is-scrolled class once page scrolls past hero', async ({ page }) => {
    const nav = page.locator('#top-nav');
    await expect(nav).not.toHaveClass(/is-scrolled/);
    await page.evaluate(() => window.scrollTo(0, 800));
    await expect(nav).toHaveClass(/is-scrolled/);
  });
});

