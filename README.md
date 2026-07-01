# Techdome QA — Playwright Test Suite

End-to-end, integration, security, and load tests for [techdome.io](https://techdome.io).

## Prerequisites

- Node.js 18+
- npm
- k6 (optional — only if you want to run the k6 load test)
  - Install: https://grafana.com/docs/k6/latest/set-up/install-k6/

## Setup

```bash
npm install
npx playwright install
```

---

## Running Tests

### All tests (E2E + Integration + Security) — recommended: 1 worker

Tests run most reliably with a single worker. This avoids concurrency issues on the live site.

```bash
npx playwright test --workers=1
```

Or using the npm script (runs Chromium, Firefox, WebKit):

```bash
npm run test:all
```

### Individual suites

```bash
# E2E tests only
npm run test:e2e

# Integration tests only
npm run test:integration

# Security tests only
npm run test:security
```

---

## Load Testing

The load test simulates **exactly 5 concurrent users** — a hard constraint from the assignment. Two options are available:

### Option 1 — Playwright (browser-based, 5 workers)

Runs 5 real browser sessions concurrently against the homepage and /contact-us. Catches real-world asset load failures (JS, CSS, images).

```bash
npm run test:load
```

This runs: `npx playwright test tests/load/ --workers=5 --project=load`

Results are auto-saved to `docs/load-test-results.md` after the run.

### Option 2 — k6 (HTTP-only, lightweight)

Runs 5 concurrent HTTP-level requests without a real browser. Faster and more stable — does not load JS/CSS assets. Good for raw server response time measurement.

```bash
npm run test:load:k6
```

This runs: `k6 run load/load.k6.js`

> **Note:** k6 must be installed separately. See [k6 installation](https://grafana.com/docs/k6/latest/set-up/install-k6/).
> Results are saved to `docs/k6-load-test-results.md`.

### Why the two tools give different results

| | Playwright load | k6 load |
|---|---|---|
| Browser type | Real Chromium browser | HTTP client only |
| Loads JS/CSS/images | Yes | No |
| Detects asset 503s | Yes | No |
| Speed | Slower | Faster |
| Best for | Real user simulation | Raw server throughput |

---

## View HTML Report

```bash
npm run report
# or
npx playwright show-report
```

---

## Project Structure

```
tests/
├── e2e/              # Full user journey tests (homepage, navigation, forms, CTAs, mobile)
├── integration/      # API, network, third-party script tests
├── security/         # HTTP headers, XSS injection, data exposure tests
└── load/             # 5-user concurrent Playwright load test

load/
└── load.k6.js        # k6 HTTP load test (alternative to Playwright load)

utils/
├── helpers.ts        # LCP measurement, overflow detection, console error capture
└── fixtures.ts       # Page Object Models for HomePage and ContactPage

docs/
├── user-story-map.md       # 16 user stories across all test types
├── claude-code-log.md      # Claude Code usage log
├── bugs.md                 # Bugs found during test runs
├── load-test-results.md    # Playwright load test results (auto-generated)
└── k6-load-test-results.md # k6 load test results
```

---

## Test Count

| Suite | Tests | Browsers |
|-------|-------|---------|
| E2E | 30 | Chromium, Firefox, WebKit |
| Integration | 7 | Chromium, Firefox, WebKit |
| Security | 10 | Chromium, Firefox, WebKit |
| Load (Playwright) | 5 | Chromium only (5 workers) |
| **Total** | **52** | |

---

## Load Test Constraint

The load test uses exactly **5 concurrent users** and never exceeds this. Enforced by:
1. Exactly 5 test cases in `tests/load/load.spec.ts`
2. `test.describe.configure({ mode: 'parallel' })` for concurrent execution
3. `--workers=5` flag in the `npm run test:load` script
4. Dedicated `load` project in `playwright.config.ts` (Chromium only — not multiplied across browser matrix)
5. k6 script caps VUs at `5` in `load/load.k6.js`
