import { test, expect } from '@playwright/test';

test.describe('HTTP Security Headers Audit', () => {
  const appUrl = 'http://techdome.io';

  test('X-Frame-Options header is present', async ({ request }) => {
    // Send GET request to the application
    const response = await request.get(appUrl);

    // Verify application is reachable
    expect(response.status(), 'Application should be reachable').toBeLessThan(400);

    // Get all response headers
    const headers = response.headers();

    // Read X-Frame-Options header
    const xFrameOptions = headers['x-frame-options'];

    // Assert X-Frame-Options header is present
    expect(
      xFrameOptions,
      'X-Frame-Options header should be present to prevent clickjacking'
    ).toBeTruthy();

    // Optional: validate correct value
    expect(
      ['DENY', 'SAMEORIGIN'],
      'X-Frame-Options should be either DENY or SAMEORIGIN'
    ).toContain(xFrameOptions!.toUpperCase());
  });

  test('Content-Security-Policy header is present', async ({ request }) => {
    // Send GET request to the application
    const response = await request.get(appUrl);

    // Verify application is reachable
    expect(response.status(), 'Application should be reachable').toBeLessThan(400);

    // Get all response headers
    const headers = response.headers();

    // Read Content-Security-Policy header
    const contentSecurityPolicy = headers['content-security-policy'];

    // Assert Content-Security-Policy header is present
    expect(
      contentSecurityPolicy,
      'Content-Security-Policy header should be present to reduce XSS risk'
    ).toBeTruthy();
  });

  test('Strict-Transport-Security header is present', async ({ request }) => {
    // Send GET request to the application
    const response = await request.get(appUrl);

    // Verify application is reachable
    expect(response.status(), 'Application should be reachable').toBeLessThan(400);

    // Get all response headers
    const headers = response.headers();

    // Read Strict-Transport-Security header
    const strictTransportSecurity = headers['strict-transport-security'];

    // Assert Strict-Transport-Security header is present
    expect(
      strictTransportSecurity,
      'Strict-Transport-Security header should be present to enforce HTTPS'
    ).toBeTruthy();
  });
});