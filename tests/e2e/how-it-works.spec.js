import { test, expect } from '@playwright/test';

test('how-it-works shows three numbered steps', async ({ page }) => {
  await page.goto('/');
  const steps = page.locator('#how-it-works .hiw-step');
  await expect(steps).toHaveCount(3);
  await expect(steps.nth(0)).toContainText(/get a quote/i);
  await expect(steps.nth(1)).toContainText(/we design it free/i);
  await expect(steps.nth(2)).toContainText(/printed.+delivered/i);
});
