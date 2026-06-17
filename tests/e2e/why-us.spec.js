import { test, expect } from '@playwright/test';

test('why-us highlights the 20-year, Bradford-based story', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#why-us');
  await expect(section).toContainText('20 years');
  await expect(section).toContainText(/bradford/i);
  await expect(section).toContainText(/thousands|nationwide/i);
});
