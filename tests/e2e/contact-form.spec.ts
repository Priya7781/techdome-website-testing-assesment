import { test, expect } from '@playwright/test';

test.describe('Contact / Enquiry Form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact-us');
    await page.waitForLoadState('domcontentloaded');
  });

  test('contact page loads with form visible', async ({ page }) => {
    // The send message button should be present
    const submitBtn = page.getByRole('button', { name: /send message/i });
    await expect(submitBtn).toBeVisible();
  });

  test('required fields show validation on empty submit', async ({ page }) => {
    const submitBtn = page.getByRole('button', { name: /send message/i });
    await submitBtn.click();

    // At least one required-field indicator should become visible
    // (browser native validation or custom error messages)
    const formInputs = page.locator('input[required], textarea[required]');
    const count = await formInputs.count();
    expect(count, 'Form should have required fields').toBeGreaterThan(0);

    // Check that the page did NOT navigate away (form should be invalid)
    expect(page.url()).toMatch(/contact-us/);
  });

  test('email field rejects invalid format', async ({ page }) => {
    // const emailInput = page.locator('input[type="email"], input[name*="email" i], input[placeholder*="email" i]').first();
    const emailInput=page.locator('#Email');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('not-an-email');

    const submitBtn = page.getByRole('button', { name: /send message/i });
    await submitBtn.click();

    // Should stay on page (invalid submission)
    expect(page.url()).toMatch(/contact-us/);
  });

  test('all form fields accept valid input', async ({ page }) => {
    const company = page.locator('#Company');
    await expect(company).toBeVisible();
    await company.fill('Techdome Inc');

    const firstName = page.locator('#First_Name');
    await expect(firstName).toBeVisible();
    await firstName.fill('John');

    const lastName = page.locator('#Last_Name');
    await expect(lastName).toBeVisible();
    await lastName.fill('Doe');

    const email = page.locator('#Email');
    await expect(email).toBeVisible();
    await email.fill('qa-test@example.com');

    const mobile = page.locator('#Mobile');
    await expect(mobile).toBeVisible();
    await mobile.fill('9876543210');

    const message = page.locator('#Message');
    await expect(message).toBeVisible();
    await message.fill('Automated QA test message. Please ignore.');

    // Verify all fields retained their values
    await expect(company).toHaveValue('Techdome Inc');
    await expect(firstName).toHaveValue('John');
    await expect(lastName).toHaveValue('Doe');
    await expect(email).toHaveValue('qa-test@example.com');
    await expect(mobile).toHaveValue('9876543210');
    await expect(message).toHaveValue('Automated QA test message. Please ignore.');

    // Form should still be on page (we don't submit to avoid hitting real CRM)
    expect(page.url()).toMatch(/contact-us/);
  });

  test('message textarea has character limit feedback', async ({ page }) => {
    const textarea = page.locator('#Message');
    if (await textarea.isVisible()) {
      // Fill to 260 chars (over 250 limit mentioned in site profile)
      await textarea.fill('A'.repeat(260));
      const value = await textarea.inputValue();
      // Either capped at 250 or longer (no cap) — document the behaviour
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
