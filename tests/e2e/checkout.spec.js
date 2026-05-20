import { test, expect } from '@playwright/test';

test.describe('Stripe checkout flow', () => {
  test('clicking a price cell triggers redirect to checkout.stripe.com', async ({ page }) => {
    const STUB_URL = 'https://checkout.stripe.com/c/pay/cs_test_PLAYWRIGHT';

    // Intercept the API call and return a fake URL.
    await page.route('**/api/create-checkout-session', async (route) => {
      const req = route.request();
      expect(req.method()).toBe('POST');
      const body = JSON.parse(req.postData() || '{}');
      expect(body).toMatchObject({ size: expect.any(String), qty: expect.any(String) });
      expect(body.attempt_id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: STUB_URL }),
      });
    });

    // Block the actual Stripe navigation so the test doesn't leave Playwright.
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'stub' })
    );

    await page.goto('/');
    // Click the A4 / 20K cell.
    const cell = page.locator('.pt-cell[data-size="A4"][data-qty="20K"]');
    await expect(cell).toBeVisible();
    await cell.click();

    // After click we expect a navigation to the stub URL.
    await page.waitForURL(STUB_URL, { timeout: 5000 });
  });

  test('cell goes aria-busy while request is in flight', async ({ page }) => {
    let release;
    const blocker = new Promise((r) => { release = r; });

    await page.route('**/api/create-checkout-session', async (route) => {
      await blocker;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'https://checkout.stripe.com/c/pay/cs_test_BUSY' }),
      });
    });
    await page.route('https://checkout.stripe.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'text/plain', body: 'stub' })
    );

    await page.goto('/');
    const cell = page.locator('.pt-cell[data-size="A4"][data-qty="20K"]');
    await cell.click();
    await expect(cell).toHaveAttribute('aria-busy', 'true');
    release();
    await page.waitForURL('https://checkout.stripe.com/**', { timeout: 5000 });
  });

  test('shows fallback error when API returns 500', async ({ page }) => {
    await page.route('**/api/create-checkout-session', (route) =>
      route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"upstream"}' })
    );

    await page.goto('/');
    const cell = page.locator('.pt-cell[data-size="A5"][data-qty="10K"]');
    await cell.click();
    await expect(page.locator('#checkout-status')).toContainText(/could not start checkout/i);
    await expect(cell).toHaveAttribute('aria-busy', 'false');
  });
});
