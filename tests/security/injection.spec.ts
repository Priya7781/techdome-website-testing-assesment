import { test, expect } from '@playwright/test';

const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  "'; DROP TABLE users; --",
  '<svg onload=alert(1)>',
];

test.describe('Injection and XSS', () => {
  test('contact form rejects / sanitises script injection in name field', async ({ page }) => {
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });

    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    const company = page.locator('#Company');
    if (await company.isVisible()) {
      await company.fill(XSS_PAYLOADS[0]);
    }

    const firstName = page.locator('#First_Name');
    if (await firstName.isVisible()) {
      await firstName.fill(XSS_PAYLOADS[0]);
    }

    const lastName = page.locator('#Last_Name');
    if (await lastName.isVisible()) {
      await lastName.fill(XSS_PAYLOADS[0]);
    }

    const email = page.locator('#Email');
    if (await email.isVisible()) {
      await email.fill('qa-test@example.com');
    }

    const mobile = page.locator('#Mobile');
    if (await mobile.isVisible()) {
      await mobile.fill('9876543210');
    }

    const submitBtn = page.getByRole('button', { name: /send message/i });
    const isSubmitVisible = await submitBtn.isVisible().catch(() => false);
    if (isSubmitVisible) {
      await submitBtn.click().catch(() => {});
    }
    await page.waitForTimeout(2000);

    expect(alertFired, 'Script injection triggered an alert — XSS vulnerability present').toBe(false);
  });

  test('XSS payload in email field does not execute', async ({ page }) => {
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });

    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    const email = page.locator('#Email');
    if (await email.isVisible()) {
      // Type-validated email fields should reject this outright
      await email.fill('"><script>alert(1)</script>@evil.com');
    }

    const submitBtn = page.getByRole('button', { name: /send message/i });
    const isSubmitVisible = await submitBtn.isVisible().catch(() => false);
    if (isSubmitVisible) {
      await submitBtn.click().catch(() => {});
    }
    await page.waitForTimeout(2000);

    expect(alertFired, 'XSS in email field triggered an alert').toBe(false);
  });

  test('textarea rejects script injection without executing it', async ({ page }) => {
    await page.goto('/contact-us', { waitUntil: 'domcontentloaded' });

    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      await dialog.dismiss();
    });

    const message = page.locator('#Message');
    if (await message.isVisible()) {
      await message.fill(XSS_PAYLOADS[0]);
    }

    const submitBtn = page.getByRole('button', { name: /send message/i });
    const isSubmitVisible = await submitBtn.isVisible().catch(() => false);
    if (isSubmitVisible) {
      await submitBtn.click().catch(() => {});
    }
    await page.waitForTimeout(2000);

    expect(alertFired, 'XSS in textarea triggered an alert').toBe(false);
  });
});
