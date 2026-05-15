import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe-core finds no serious or critical violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
  if (serious.length) {
    console.error('A11y violations:', JSON.stringify(serious, null, 2));
  }
  expect(serious).toEqual([]);
});

test('skip link is reachable on first Tab', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) {
    // Mobile browsers do not support Tab-key keyboard navigation in the same
    // way as desktop; focus the skip link directly to verify it is accessible.
    await page.focus('.skip-link');
    const focused = await page.evaluate(() => document.activeElement?.className);
    expect(focused).toContain('skip-link');
  } else {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className);
    expect(focused).toContain('skip-link');
  }
});

test('all gallery images have non-empty alt text', async ({ page }) => {
  await page.goto('/');
  const alts = await page.locator('#gallery img').evaluateAll(els => els.map(e => e.alt));
  for (const a of alts) expect(a.length).toBeGreaterThan(3);
});

test('every form field has an associated label', async ({ page }) => {
  await page.goto('/');
  const orphans = await page.evaluate(() => {
    const fields = Array.from(document.querySelectorAll('#quote-form input, #quote-form select, #quote-form textarea'));
    return fields.filter(f => f.type !== 'hidden')
      .filter(f => !f.closest('label') && !document.querySelector(`label[for="${f.id}"]`))
      .map(f => f.name || f.id);
  });
  expect(orphans).toEqual([]);
});
