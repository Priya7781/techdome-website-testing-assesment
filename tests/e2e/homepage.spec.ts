import { test, expect } from '@playwright/test';

test.describe('Homepage content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Techdome/i);
  });

  test('hero section is visible', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
  });

  test('meta description is present', async ({ page }) => {
    const metaDescription = page.locator('meta[name="description"]');
    const content = await metaDescription.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });
});
