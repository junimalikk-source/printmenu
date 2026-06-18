import { test, expect } from '@playwright/test';

test('SEO meta tags and structured data are present', async ({ page }) => {
  await page.goto('/');
  // Open Graph
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /PrintMenu/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /menus/i);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  // JSON-LD LocalBusiness (page may carry several ld+json blocks)
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  const data = blocks.map(b => JSON.parse(b)).find(d => d['@type'] === 'LocalBusiness');
  expect(data).toBeTruthy();
  expect(data.name).toBe('PrintMenu.co.uk');
  expect(data.telephone).toBe('+447488279811');
  expect(data.address.addressLocality).toBe('Bradford');
  expect(data.areaServed.name).toBe('United Kingdom');
});
