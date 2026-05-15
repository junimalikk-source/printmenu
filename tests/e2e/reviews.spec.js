import { test, expect } from '@playwright/test';

test('reviews section shows three star-rated quotes', async ({ page }) => {
  await page.goto('/');
  const cards = page.locator('#reviews .review');
  await expect(cards).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await expect(cards.nth(i).locator('.stars')).toContainText('★★★★★');
    await expect(cards.nth(i).locator('cite')).not.toBeEmpty();
  }
});
