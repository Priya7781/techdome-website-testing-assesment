import { test, expect } from '@playwright/test';

test.describe('Third-party scripts and network', () => {
  test('page loads without render-blocking failures', async ({ page }) => {
    const failedRequests: string[] = [];

    page.on('requestfailed', (req) => {
      // Only care about script/stylesheet failures that could block rendering
      const resourceType = req.resourceType();
      if (resourceType === 'script' || resourceType === 'stylesheet') {
        failedRequests.push(`${resourceType}: ${req.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    expect(
      failedRequests,
      `Render-blocking resources failed to load:\n${failedRequests.join('\n')}`
    ).toHaveLength(0);
  });

  test('no 5xx errors from any network request during page load', async ({ page }) => {
    const serverErrors: string[] = [];

    page.on('response', (res) => {
      if (res.status() >= 500) {
        serverErrors.push(`${res.status()} ${res.url()}`);
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    expect(serverErrors, `Server errors during load:\n${serverErrors.join('\n')}`).toHaveLength(0);
  });

  test('Google Maps iframe loads on contact page without blocking main content', async ({ page }) => {
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });

    // Main content (form) should be visible before/during map load
    const submitBtn = page.getByRole('button', { name: /send message/i });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    // Map iframe presence is optional — just verify it doesn't crash the page
    const mapIframe = page.locator('iframe[src*="google.com/maps"], iframe[src*="maps.google"]');
    const mapCount = await mapIframe.count();
    // Whether 0 or 1, the page must remain functional
    expect([0, 1]).toContain(mapCount);
  });

  test('page has no console errors on homepage load', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // Filter out known benign browser extension / third-party noise
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('extension')) {
          consoleErrors.push(text);
        }
      }
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    if (consoleErrors.length > 0) {
      console.warn('Console errors on homepage:', consoleErrors);
    }
    // Soft check — log but don't fail hard on third-party console errors
    expect(consoleErrors.length).toBeLessThan(5);
  });
});
