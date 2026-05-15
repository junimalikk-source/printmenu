import { test, expect } from '@playwright/test';

test('why-us shows two stat badges with the right numbers', async ({ page }) => {
  await page.goto('/');
  const section = page.locator('#why-us');
  await expect(section).toContainText('20 years');
  await expect(section.locator('.stat-num').nth(0)).toContainText('20');
  await expect(section.locator('.stat-num').nth(1)).toContainText(/1,?000/);
  await expect(section).toContainText(/bradford/i);
});
