import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../../utils/helpers';

test.describe('Tablet 768px viewport', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('no horizontal overflow at 768px', async ({ page }) => {
    await checkNoHorizontalOverflow(page);
  });

  test('page renders with visible content at 768px', async ({ page }) => {
    const body = page.locator('body');
    await expect(body).toBeVisible();
    const text = await body.innerText();
    expect(text.trim().length).toBeGreaterThan(50);
  });

  test('navigation is accessible at 768px', async ({ page }) => {
   
  const desktopNav = page.locator("//nav[contains(@class,'max-md:hidden')]");
  const mobileMenuIcon = page.locator("//nav//img[@alt='Menu' and contains(@class,'burger-icon')]");

  await expect(desktopNav).toBeHidden();
  await expect(mobileMenuIcon).toBeVisible();
  });

  test('images are scaled appropriately at 768px (no overflow)', async ({ page }) => {
    const hasOverflowingImage = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.some((img) => img.getBoundingClientRect().width > window.innerWidth);
    });
    expect(hasOverflowingImage).toBe(false);
  });


  test('contact-us page is accessible at 768px', async ({ page }) => {
    // At 768px the nav is collapsed to a hamburger — mobile menu toggle requires JS (blocked by BUG-001).
    // Navigate directly to verify the contact page loads correctly at tablet viewport.
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('contact-us');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const locationLinks = page.locator("//a[@href='#']").filter({ hasText: /location/i });
    const count = await locationLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);

    for (let i = 0; i < count; i++) {
      const link = locationLinks.nth(i);
      await link.scrollIntoViewIfNeeded();
      await link.hover();
      await link.click();
      await page.waitForTimeout(1000);

      const urlAfter = page.url();
      const navigatedToMap = urlAfter.includes('maps') || urlAfter.includes('google') || urlAfter.includes('goo.gl');
      expect.soft(navigatedToMap, `BUG: Location link ${i + 1} did not navigate to a map (stayed on ${urlAfter})`).toBe(true);
    }
  });
});
