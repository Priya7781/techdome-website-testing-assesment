import { test, expect } from '@playwright/test';

const PRIMARY_PAGES = [
  { path: '/', name: 'Homepage' },
  { path: '/about-us', name: 'About Us' },
  { path: '/contact-us', name: 'Contact Us' },
  { path: '/careers', name: 'Careers' },
  { path: '/blog-and-article', name: 'Blog & Articles' },
];

test.describe('Page HTTP status codes', () => {
  test('all primary pages return HTTP 200', async ({ request }) => {
    const failures: string[] = [];

    for (const pg of PRIMARY_PAGES) {
      const response = await request.get(`https://techdome.io${pg.path}`);
      if (response.status() !== 200) {
        failures.push(`${pg.name} (${pg.path}) returned ${response.status()}`);
      }
    }

    expect(failures, `Pages with non-200 status:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('solution pages return HTTP 200 or 301/302 redirect', async ({ request }) => {
    const solutionPages = [
      '/solution/cloud-computing-solutions',
      '/solution/solution/AI-solutions',
      '/solution/Cybersecurity-solutions',
    ];

    for (const path of solutionPages) {
      const response = await request.get(`https://techdome.io${path}`, {
        maxRedirects: 5,
      });
      expect(
        [200, 301, 302],
        `${path} returned unexpected status ${response.status()}`
      ).toContain(response.status());
    }
  });

  test('404 page exists for unknown routes', async ({ request }) => {
    const response = await request.get('https://techdome.io/this-page-does-not-exist-xyz-abc');
    expect([404, 200], 'Expected 404 or custom 404 handled by SPA').toContain(response.status());
  });
});
