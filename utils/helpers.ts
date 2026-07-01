import { Page, expect } from '@playwright/test';

export async function checkNoHorizontalOverflow(page: Page): Promise<void> {
  const hasOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(hasOverflow, 'Page should not have horizontal overflow').toBe(false);
}

export async function measureLCP(page: Page): Promise<number> {
  return page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let lcpValue = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        lcpValue = last.startTime;
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(lcpValue);
      }, 5000);
    });
  });
}

export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  return errors;
}

export async function checkResponseStatus(page: Page, url: string): Promise<number> {
  const response = await page.request.get(url);
  return response.status();
}

export async function getAllNavLinks(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('nav a, header a'));
    return anchors.map((a) => (a as HTMLAnchorElement).href).filter((h) => h.startsWith('http'));
  });
}
