import { test, expect } from '@playwright/test';

test('SEO meta tags and structured data are present', async ({ page }) => {
  await page.goto('/');
  // Open Graph
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Cheapestprint/);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', /menus/i);
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  // JSON-LD LocalBusiness
  const ld = await page.locator('script[type="application/ld+json"]').textContent();
  const data = JSON.parse(ld);
  expect(data['@type']).toBe('LocalBusiness');
  expect(data.name).toBe('Cheapestprint.co.uk');
  expect(data.telephone).toBe('+441274305555');
  expect(data.address.addressLocality).toBe('Bradford');
  expect(data.areaServed).toBe('United Kingdom');
});
