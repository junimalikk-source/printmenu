import { test, expect } from '@playwright/test';

test.describe('pricing table', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/'); });

  test('renders 4 size rows and 4 quantity columns', async ({ page }) => {
    await expect(page.locator('#pricing .pt-row')).toHaveCount(4);
    await expect(page.locator('#pricing .pt-head .pt-col')).toHaveCount(4);
  });

  test('A4 row is marked Most Popular', async ({ page }) => {
    const a4row = page.locator('#pricing .pt-row[data-size="A4"]');
    await expect(a4row).toContainText(/most popular/i);
  });

  test('40K column has Best Value badge', async ({ page }) => {
    await expect(page.locator('#pricing .pt-head .pt-col[data-qty="40K"]')).toContainText(/best value/i);
  });

  test('100K column has Bulk Savings badge', async ({ page }) => {
    await expect(page.locator('#pricing .pt-head .pt-col[data-qty="100K"]')).toContainText(/bulk savings/i);
  });

  test('A4 / 10K cell shows was £525 and now £425', async ({ page }) => {
    const cell = page.locator('#pricing .pt-cell[data-size="A4"][data-qty="10K"]');
    await expect(cell.locator('.pt-was')).toContainText('£525');
    await expect(cell.locator('.pt-now')).toContainText('£425');
  });

  test('A3 / 100K cell shows was £3850 and now £2800', async ({ page }) => {
    const cell = page.locator('#pricing .pt-cell[data-size="A3"][data-qty="100K"]');
    await expect(cell.locator('.pt-was')).toContainText('£3850');
    await expect(cell.locator('.pt-now')).toContainText('£2800');
  });

  test('on mobile the table reflows to stacked cards', async ({ page, viewport }) => {
    test.skip(viewport.width >= 720, 'mobile-only');
    await page.goto('/');
    const a4row = page.locator('#pricing .pt-row[data-size="A4"]');
    await expect(a4row).toBeVisible();

    // In the stacked layout, the row should display as block, not a 5-column grid.
    const display = await a4row.evaluate(el => getComputedStyle(el).display);
    expect(display).toBe('block');
  });

  test('clicking a price cell scrolls to form and pre-fills selects', async ({ page }) => {
    await page.goto('/');
    // The form's selects don't exist yet (they're added in Task 16).
    // Until then, this test only asserts the cell is clickable + scrolls.
    await page.locator('#pricing .pt-cell[data-size="A4"][data-qty="20K"]').click();
    // Allow smooth scroll to complete
    await page.waitForTimeout(800);
    const inView = await page.locator('#quote').evaluate((el) => {
      const { top, bottom } = el.getBoundingClientRect();
      return top < window.innerHeight && bottom > 0;
    });
    expect(inView).toBe(true);
  });
});
