import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load test — exactly 5 concurrent simulated users.
 * Run via: npm run test:load  (which adds --workers=5 --project=load)
 *
 * Hard constraint: never exceeds 5 concurrent users.
 * Each test = 1 user. There are exactly 5 tests in this describe block.
 */

// Shared results array written to by each worker
// (In Playwright, each worker is a separate process — we use a temp file for aggregation)
const RESULTS_TMP = path.join(process.cwd(), 'docs', 'load-results-tmp.json');
const LOAD_REPORT = path.join(path.dirname(RESULTS_TMP), 'load-test-results.md');

type LoadResult = {
  worker: number;
  page: string;
  responseTimeMs: number;
  status: number;
  error?: string;
};

async function measurePage(
  page: import('@playwright/test').Page,
  url: string,
  workerId: number
): Promise<LoadResult> {
  const start = Date.now();
  let status = 0;
  try {
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    status = response?.status() ?? 0;
  } catch (err) {
    return { worker: workerId, page: url, responseTimeMs: Date.now() - start, status: 0, error: String(err) };
  }
  return { worker: workerId, page: url, responseTimeMs: Date.now() - start, status };
}

function appendResult(result: LoadResult) {
  const existing: LoadResult[] = [];
  try {
    const raw = fs.readFileSync(RESULTS_TMP, 'utf-8');
    existing.push(...JSON.parse(raw));
  } catch {
    // File doesn't exist yet — start fresh
  }
  existing.push(result);
  fs.writeFileSync(RESULTS_TMP, JSON.stringify(existing, null, 2));
}

function writeReport(results: LoadResult[]) {
  if (results.length === 0) return;

  const times = results
    .filter((r) => !r.error && r.status !== 0)
    .map((r) => r.responseTimeMs)
    .sort((a, b) => a - b);

  const p95Index = Math.ceil(times.length * 0.95) - 1;
  const p95 = times[Math.max(0, p95Index)] ?? 0;
  const errors5xx = results.filter((r) => r.status >= 500).length;
  const verdict = p95 < 3000 && errors5xx === 0 ? '✅ PASS' : '❌ FAIL';

  const rows = results
    .map((r) => {
      const pageName = r.page.replace('https://techdome.io', '') || '/';
      return `| ${r.worker} | ${pageName} | ${r.status} | ${r.responseTimeMs} ms | ${r.error ?? '-'} |`;
    })
    .join('\n');

  const md = [
    '# Load Test Results',
    '',
    '## Summary',
    '',
    '| Metric | Value |',
    '|---|---|',
    `| Concurrent users | 5 |`,
    `| Total requests | ${results.length} |`,
    `| p95 response time | ${p95} ms |`,
    `| SLA | < 3000 ms |`,
    `| HTTP 5xx errors | ${errors5xx} |`,
    `| Result | ${verdict} |`,
    '',
    '## Detailed Results',
    '',
    '| User | Page | Status | Response Time | Error |',
    '|---|---|---|---|---|',
    rows,
    '',
  ].join('\n');

  fs.writeFileSync(LOAD_REPORT, md);
}

// Parallel mode: all 5 tests run concurrently = 5 concurrent users
test.describe.configure({ mode: 'parallel' });

test.describe('Load test — 5 concurrent users', () => {
  const WORKER_IDS = [1, 2, 3, 4, 5];

  // Clear temp file before run (only the first worker to arrive does this)
  test.beforeAll(() => {
    try {
      fs.unlinkSync(RESULTS_TMP);
    } catch {
      // Already gone — fine
    }
  });

  for (const workerId of WORKER_IDS) {
    test(`User ${workerId} — homepage and contact page load within SLA`, async ({ page }) => {
      // User hits homepage
      const homeResult = await measurePage(page, 'https://techdome.io', workerId);
      appendResult(homeResult);

      // Same user then visits contact page
      const contactResult = await measurePage(page, 'https://techdome.io/contact-us', workerId);
      appendResult(contactResult);

      // Assert no server errors
      expect(homeResult.status, `User ${workerId}: homepage returned ${homeResult.status}`).not.toBe(0);
      expect(homeResult.status, `User ${workerId}: homepage 5xx`).toBeLessThan(500);

      expect(contactResult.status, `User ${workerId}: contact page returned ${contactResult.status}`).not.toBe(0);
      expect(contactResult.status, `User ${workerId}: contact page 5xx`).toBeLessThan(500);

      // Assert response time SLA: p95 < 3000ms (each user's individual times contribute)
      expect(
        homeResult.responseTimeMs,
        `User ${workerId}: homepage took ${homeResult.responseTimeMs}ms — exceeds 3000ms`
      ).toBeLessThan(3000);

      expect(
        contactResult.responseTimeMs,
        `User ${workerId}: contact page took ${contactResult.responseTimeMs}ms — exceeds 3000ms`
      ).toBeLessThan(3000);
    });
  }

  // afterAll runs once per worker — the last worker to finish writes the complete report
  test.afterAll(() => {
    try {
      const raw = fs.readFileSync(RESULTS_TMP, 'utf-8');
      const results: LoadResult[] = JSON.parse(raw);
      writeReport(results);
    } catch {
      // Temp file not ready yet — another worker will write the report
    }
  });
});
