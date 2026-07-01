import { test, expect } from '@playwright/test';

test.describe('CTAs and external links', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('"Contact Us" CTA navigates to /contact-us', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: 'Contact Us' });
    await expect(ctaLink).toBeVisible();
    await ctaLink.click();
    await page.waitForURL(/contact-us/);
    expect(page.url()).toContain('contact-us');
  });

  // test('"Request Demo" CTA navigates to /contact-us', async ({ page }) => {
  //  const demoBtn = page.getByRole('link', { name: 'Request Demo' });
  //   if (await demoBtn.isVisible()) {
  //     await demoBtn.click();
  //     await page.waitForURL(/contact-us/);
  //     expect(page.url()).toContain('contact-us');
  //   }
  // });

  test('footer links are present and not broken', async ({ page }) => {
    const footerLinks = page.locator('footer a[href]');
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(5);

    // Spot-check first 10 footer links
    for (let i = 0; i < Math.min(10, count); i++) {
      const href = await footerLinks.nth(i).getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).not.toBe('#');
    }
  });

  test('social media icon links are present with valid hrefs', async ({ page }) => {
  const platforms = ['linkedin', 'instagram', 'youtube', 'twitter', 'facebook'];

  let validSocialLinks = 0;

  for (const platform of platforms) {
    const link = page.locator(`a[href*="${platform}"]`).first();

    if (await link.count() > 0) {
      const href = await link.getAttribute('href');

      expect(href).toContain(platform);
      expect(href).toMatch(/^https?:\/\//);

      validSocialLinks++;
    }
  }

  expect(validSocialLinks).toBeGreaterThanOrEqual(3);
});



  test('"About Us" CTA or link navigates correctly', async ({ page }) => {
    const aboutUsLink = page.getByRole('link', { name: 'About Us' }).first();
    await expect(aboutUsLink).toBeVisible();

    await aboutUsLink.click();
    await page.waitForURL(/about-us/);
    expect(page.url()).toContain('about-us');

    // Wait for actual page content to render (heading confirms SvelteKit hydrated successfully)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('"Careers" CTA or link navigates correctly', async ({ page }) => {
    
    const careersLink = page.getByRole('link', { name: 'Careers' }).first();
    await expect(careersLink).toBeVisible();

    await careersLink.click();
    await page.waitForURL(/careers/);
    expect(page.url()).toContain('careers');

    // Wait for actual page content to render (heading confirms SvelteKit hydrated successfully)
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('"Case Studies" footer link navigates correctly', async ({ page }) => {
    const caseStudiesLink = page.locator('footer').getByRole('link', { name: 'Case Studies' });
    await expect(caseStudiesLink).toBeVisible();

    await caseStudiesLink.click();
    await page.waitForLoadState('domcontentloaded');


    // expect(page.url(), 'BUG-016: Case Studies footer link does not navigate to /case-studies/').toContain('case-studies');
    await expect(
      page.locator('h2').getByText('Case Studies', { exact: true }),
      'BUG-016: Case Studies page heading not visible after navigation'
    ).toBeVisible();
  });


  test('Privacy Policy and Terms of Use links exist in footer', async ({ page }) => {
    const privacyLink = page.locator('footer').getByRole('link', { name: 'Privacy Policy' });
    const termsLink = page.locator('footer').getByRole('link', { name: 'Terms of use' });
    await expect(privacyLink).toBeVisible();
    await expect(termsLink).toBeVisible();
  });

  


});
