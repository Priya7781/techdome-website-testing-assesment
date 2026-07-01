import { test as base, Page } from '@playwright/test';

// Page Object: Homepage
export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
  }

  get heroSection() {
    return this.page.locator('section').first();
  }

  get navLinks() {
    return this.page.locator('nav a, header a');
  }

  get footerLinks() {
    return this.page.locator('footer a');
  }

  get socialIcons() {
    return this.page.locator('footer a[href*="linkedin"], footer a[href*="instagram"], footer a[href*="youtube"], footer a[href*="twitter"], footer a[href*="facebook"]');
  }

  get primaryCTAs() {
    return this.page.getByRole('link', { name: /request demo|contact us|explore more|know more/i });
  }

  get newsletterEmailInput() {
    return this.page.locator('input[type="email"]').first();
  }
}

// Page Object: Contact Page
export class ContactPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/contact-us');
  }

  get companyField() {
    return this.page.getByLabel(/company/i);
  }

  get firstNameField() {
    return this.page.getByLabel(/first name/i);
  }

  get lastNameField() {
    return this.page.getByLabel(/last name/i);
  }

  get emailField() {
    return this.page.getByLabel(/email/i);
  }

  get phoneField() {
    return this.page.getByLabel(/phone/i);
  }

  get messageField() {
    return this.page.getByLabel(/message/i);
  }

  get submitButton() {
    return this.page.getByRole('button', { name: /send message/i });
  }

  async fillValidForm() {
    await this.companyField.fill('QA Test Corp');
    await this.firstNameField.fill('QA');
    await this.lastNameField.fill('Tester');
    await this.emailField.fill('qa-test@example.com');
    await this.phoneField.fill('+91 9999999999').catch(() => {});
    await this.messageField.fill('This is an automated QA test submission. Please ignore.');
  }
}

// Custom fixtures
type Fixtures = {
  homePage: HomePage;
  contactPage: ContactPage;
};

export const test = base.extend<Fixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },
});

export { expect } from '@playwright/test';
