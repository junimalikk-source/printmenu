import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('all top-level sections render', async ({ page }) => {
  const ids = [
    'top-nav',
    'hero',
    'usps',
    'built-for',
    'social-proof',
    'pricing',
    'how-it-works',
    'gallery',
    'why-us',
    'faq',
    'quote',
    'site-footer',
  ];
  for (const id of ids) {
    await expect(page.locator(`#${id}`)).toBeVisible();
  }
});

test('Google Font Inter is loaded', async ({ page }) => {
  const fontFamily = await page.evaluate(() =>
    getComputedStyle(document.body).fontFamily
  );
  expect(fontFamily.toLowerCase()).toContain('inter');
});

test('design tokens are defined on :root', async ({ page }) => {
  const tokens = await page.evaluate(() => {
    const s = getComputedStyle(document.documentElement);
    return {
      black: s.getPropertyValue('--c-black').trim(),
      yellow: s.getPropertyValue('--c-yellow').trim(),
      offWhite: s.getPropertyValue('--c-off-white').trim(),
    };
  });
  expect(tokens.black).toBe('#11295A');
  expect(tokens.yellow).toBe('#06B5E2');
  expect(tokens.offWhite).toBe('#FAFAFA');
});
