import { test, expect } from '@playwright/test';

test('USP strip shows four cards with the spec content', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#usps .usp');
  await expect(cards).toHaveCount(4);
  await expect(cards.nth(0)).toContainText(/3.5 days/i);
  await expect(cards.nth(1)).toContainText(/free design/i);
  await expect(cards.nth(2)).toContainText(/free uk delivery/i);
  await expect(cards.nth(3)).toContainText(/130gsm/i);
  await expect(cards.first().locator('img,svg')).toBeVisible();
});
