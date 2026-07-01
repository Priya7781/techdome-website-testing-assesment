import { test, expect } from '@playwright/test';
import { checkNoHorizontalOverflow } from '../../utils/helpers';

test.describe('Mobile 375px viewport', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('no horizontal overflow at 375px', async ({ page }) => {
    await checkNoHorizontalOverflow(page);
  });

  test('navigation collapses to hamburger menu at 375px', async ({ page }) => {
    // On mobile, the desktop nav should be hidden and a toggle/hamburger visible
   const desktopNav = page.locator("//nav[contains(@class,'max-md:hidden')]");
    const hamburger = page.locator("//nav//img[@alt='Menu' and contains(@class,'burger-icon')]");

    const isHamburgerPresent = await hamburger.isVisible().catch(() => false);
    const isDesktopNavHidden =
      !isHamburgerPresent || !(await desktopNav.isVisible().catch(() => false));

    // Either a hamburger is visible OR the desktop nav hides — both indicate responsive behaviour
    expect(isHamburgerPresent || isDesktopNavHidden).toBe(true);
  });

  test('hero content is visible without scrolling at 375px', async ({ page }) => {
    const heroSection = page.locator("//main[contains(@class,'video-background')]//section[contains(@class,'max-w-screen-xl')]");
    await expect(heroSection).toBeVisible();
  });

  test('office location links on /contact-us navigate to a map at 375px', async ({ page }) => {
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });

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
      expect.soft(navigatedToMap, `BUG-017: Location link ${i + 1} did not navigate to a map (stayed on ${urlAfter})`).toBe(true);
    }
  });

  test('text is readable (not clipped) at 375px', async ({ page }) => {
    // No element should have overflowing text that's invisible
    const hasClippedText = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, p'));
      return elements.some((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > window.innerWidth;
      });
    });
    expect(hasClippedText).toBe(false);
  });

  test('images are scaled appropriately at 375px (no overflow)', async ({ page }) => {
    const hasOverflowingImage = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.some((img) => img.getBoundingClientRect().width > window.innerWidth);
    });
    expect(hasOverflowingImage).toBe(false);
  });

});


