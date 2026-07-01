import { test, expect } from '@playwright/test';

const NAV_ITEMS = [
  { label: /about us/i, urlPattern: /about-us/ },
  { label: /careers/i, urlPattern: /careers/ },
  { label: /contact us/i, urlPattern: /contact-us/ },
];

test.describe('Navigation', () => {
  test('all primary nav links are present and visible', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Header navigation should contain key links
    await expect(page.getByRole('link', { name: /about us/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /contact us/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /careers/i }).first()).toBeVisible();
  });

  test('nav "links" resolve without 404 or blank page', async ({ page }) => {
  for (const navItem of NAV_ITEMS) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const link = page.getByRole('link', { name: navItem.label }).first();
    await expect(link).toBeVisible();

    // Get the actual href value from the link
    const href = await link.getAttribute('href');

    // Make sure href is present
    expect(href, `${navItem.label} link should have href`).not.toBeNull();

    // Convert relative href like "/about" into full URL
    const targetUrl = new URL(href!, page.url()).toString();

    // Send direct request to the target URL
    const response = await page.request.get(targetUrl);

    // Verify page is not 404 or server error
    expect(
      response.status(),
      `${navItem.label} should not return 404 or server error`
    ).toBeLessThan(400);

    // Now click the link like a real user
    await link.click();

    // Verify URL after navigation
    await page.waitForURL(navItem.urlPattern, { timeout: 15000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    expect(page.url()).toMatch(navItem.urlPattern);

    // Verify page is not blank
    const bodyText = await page.locator('body').innerText();

    expect(bodyText.trim().length).toBeGreaterThan(20);
  }
});
  test('no broken internal links return 404', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const internalLinks = await page.evaluate(() => {
      const origin = window.location.origin;
      return Array.from(document.querySelectorAll('a[href]'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((h) => h.startsWith(origin) && !h.includes('#'))
        .filter((v, i, arr) => arr.indexOf(v) === i); // dedupe
    });

    const broken: string[] = [];
    for (const url of internalLinks.slice(0, 15)) { // test first 15 to stay fast
      const response = await page.request.get(url);
      if (response.status() === 404) broken.push(url);
    }
    expect(broken, `Broken links found: ${broken.join(', ')}`).toHaveLength(0);
  });

  test('browser back button works after navigation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /about us/i }).first().click();
    await page.waitForURL(/about-us/);
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toMatch(/techdome\.io/);
  });
});
