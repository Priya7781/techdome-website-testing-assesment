# Bug Report — techdome.io

> Test run: 2026-07-01 | Suite: E2E + Integration + Security | Browsers: Chromium, Firefox, WebKit  
> Result: 128 passed, 19 failed (147 total)

---

## BUG-001

**Severity:** Critical  
**Nature:** Intermittent — triggers under concurrent load (5+ simultaneous browser sessions)  
**Summary:** Pages and SvelteKit bundle assets returning 503 Service Unavailable under load — SPA fails to hydrate

**Steps to reproduce:**
1. Run `npm run test:load` (5 concurrent browser workers hitting the site simultaneously)
2. Observe network responses for `/` and `/contact-us` pages and `/_app/immutable/` asset paths

**Note:** Running a single browser session (1 worker) does **not** reproduce this — pages and assets load fine under light traffic. The 503s only appear when 5 concurrent real browser sessions hit the CDN/origin at the same time.

**Expected:** All pages and static assets return HTTP 200 under concurrent load within the 3000ms SLA.  
**Actual (confirmed across 2 consecutive load runs):**

Run 1 — all 5 workers failed:
| User | Homepage | Contact Page | Failure |
|------|----------|--------------|---------|
| User 1 | 503 | — | 5xx on homepage |
| User 2 | 200 | 503 | 5xx on contact |
| User 3 | — | status 0 (timeout 5866ms) | navigation timeout |
| User 4 | 503 | — | 5xx on homepage |
| User 5 | 200 / 3145ms | 503 | 5xx on contact |

Run 2 — all 5 workers failed:
| User | Homepage | Contact Page | Failure |
|------|----------|--------------|---------|
| User 1 | 200 / 1241ms | 503 / 73ms | 5xx on contact |
| User 2 | 200 / 1547ms | 503 / 48ms | 5xx on contact |
| User 3 | 200 / 1254ms | 503 / 61ms | 5xx on contact |
| User 4 | 200 / 2363ms | 200 / 3613ms | SLA breach (3613ms > 3000ms) |
| User 5 | 503 / 126ms | — | 5xx on homepage |

`/contact-us` is the weakest endpoint — returning 503 under concurrent load in both runs. Even when pages return 200, response times breach the 3000ms SLA (User 4, Run 2: 3613ms).

**Evidence:** `tests/load/load.spec.ts` (5 workers) — 5 failed in both runs. Single-worker run (`npx playwright test tests/integration/third-party.spec.ts`) passes cleanly across all 3 browsers — confirming the bug is load-triggered, not constant.  
**Impact:** Site cannot sustain 5 concurrent real browser sessions. `/contact-us` is the primary failure point. Cascades into E2E, navigation, footer, mobile, and third-party test failures under load.

---

## BUG-002

**Severity:** Medium  
**Summary:** Contact form fields lack HTML `required` attribute — validation has no browser-native fallback when JavaScript is unavailable

**How validation currently works:**
When "Send Message" is clicked with empty required fields, JavaScript does two things simultaneously:
1. Injects a red `<p>Please complete this required field</p>` into the DOM as a visual error
2. Blocks the form from submitting via a JS event handler

This works correctly when JS is running. The `<p>` tag itself does not stop submission — the JS event handler does. Both disappear when JS is unavailable.

**Exact scenario where this becomes a bug — JS disabled or blocked:**
1. Navigate to https://techdome.io/contact-us (SvelteKit SSR renders the form HTML — fields are visible without JS)
2. Leave required fields empty
3. Click "Send Message"
4. Without JS: the event handler never runs → no `<p>` error injected → no submission blocked
5. Without `required` on the inputs: the browser has no native validation to fall back on either
6. Result: form submits with empty/incomplete data to the backend CRM

This is relevant for Techdome's target audience — enterprise clients often use corporate proxies or firewalls that restrict JavaScript execution.

**Protection layers comparison:**

| | JS enabled | JS disabled / blocked |
|---|---|---|
| With `required` on inputs | Browser + JS both block (double protection) | Browser still blocks ✅ |
| Without `required` (current) | JS blocks ✅ | Nothing blocks submission ❌ |

**Steps to verify missing attribute:**
1. Navigate to https://techdome.io/contact-us
2. Right-click any form input → Inspect Element
3. Observe `<input id="Last_Name" type="text" maxlength="30" ...>` — no `required` attribute present

**Expected:** Required fields (Company, First Name, Last Name, Email) have `required` attribute as a browser-native fallback independent of JavaScript.  
**Actual:** Zero form inputs carry `required`. The only protection against empty submission is the JS event handler.

**Evidence:** E2E test `required fields show validation on empty submit` failed in Chromium and Firefox:  
`expect(0).toBeGreaterThan(0)` — zero inputs matched `input[required], textarea[required]`.

---

## BUG-003

**Severity:** High  
**Summary:** Footer "Case Studies" link leads to a 404 "Page Not Found" page

**Steps:**
1. Navigate to https://techdome.io
2. Scroll to the footer
3. Click the "Case Studies" link under the Company section

**Expected:** The Case Studies page loads successfully at `/case-studies/`.  
**Actual:** Footer link points to `/case-study` (singular, incorrect slug) which returns "Oops! Page Not Found" with an auto-redirect to the homepage after 3 seconds. The working page exists at `/case-studies/` (plural).

**Evidence:** E2E test `"Case Studies" footer link navigates correctly` failed in all 3 browsers:  
- Chromium: `locator('h2').getByText('Case Studies', { exact: true })` — element not found on 404 page  
- Firefox: `locator resolved to <a href="/case-study">Case Studies</a>` — confirms wrong URL slug  
- WebKit: same as Chromium

---

## BUG-004

**Severity:** Medium  
**Summary:** All 3 office "Location" links on `/contact-us` use `href="#"` — clicking does not open a map

**Steps:**
1. Navigate to https://techdome.io/contact-us
2. Scroll down to the "Our Location" section
3. Click the "Location" link under any of the 3 offices (Hyderabad India, Indore India, Techdome LLC USA)

**Expected:** Clicking "Location" opens Google Maps (or similar) showing the office address.  
**Actual:** All 3 "Location" links have `href="#"` — clicking keeps the user on the same page (`/contact-us/#`). No map is opened.

**Evidence:** Reproduced at both 375px and 768px viewports across Chromium, Firefox, and WebKit. Soft assertions caught all 3 links failing:  
```
BUG-004: Location link 1 did not navigate to a map (stayed on https://techdome.io/contact-us/#)
BUG-004: Location link 2 did not navigate to a map (stayed on https://techdome.io/contact-us/#)
BUG-004: Location link 3 did not navigate to a map (stayed on https://techdome.io/contact-us/#)
```

---

## BUG-005

**Severity:** High  
**Nature:** Sporadic — primarily WebKit; Firefox resolved by test improvement; Chromium consistently passes  
**Summary:** Navigation tests fail intermittently in WebKit due to slow server responses; Firefox was previously affected but stabilised after adding explicit waits to the test

**Affected browsers:** WebKit (sporadic) — Chromium passes consistently; Firefox passes after test improvement

**Steps:**
1. Run `npx playwright test tests/e2e/navigation.spec.ts --project=chromium --project=firefox --project=webkit`
2. Observe sporadic WebKit failure on `nav links resolve without 404 or blank page`

**Expected:** All clickable elements are stable and pages load within timeout across all 3 browsers.

**Actual — WebKit (sporadic):**
- `nav links resolve without 404 or blank page` → click registered but `page.waitForURL()` timed out at 15s — navigation never completed, server too slow to respond under repeated page loads in the loop

WebKit automation output:
```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded
waiting for navigation until "load"
```

**Actual — Firefox (previously failing, now passing after test improvement):**
Previously: `link.click()` timed out after 10s — element was undergoing continuous DOM mutations, Firefox's strict stability checks blocked the click.
After adding explicit `waitForLoadState('domcontentloaded', { timeout: 15000 })` after click — Firefox now has enough time to settle and passes consistently.
In severe server stress runs, Firefox worker crashed entirely (`code=3221226505` — Windows access violation).

**Results across all runs (`navigation.spec.ts`):**

| Run | Chromium | Firefox | WebKit | Notes |
|-----|----------|---------|--------|-------|
| Run 1 (original test) | ✅ 4/4 | ❌ 2/4 | ❌ 1/4 | Before improvements |
| Run 2 (original test) | ✅ 4/4 | ❌ 2/4 | ❌ 1/4 | Before improvements |
| Run 3 (original test) | ❌ 1/4 | ❌ 3/4 + crash | ❌ 1/4 | Heavy server load |
| Run 4 (HTTP check added) | ✅ 4/4 | ❌ 2/4 | ✅ 4/4 | After HTTP pre-check |
| Run 5 (HTTP check added) | ✅ 4/4 | ❌ 2/4 | ✅ 4/4 | After HTTP pre-check |
| Run 6 (explicit wait added) | ✅ 4/4 | ✅ 4/4 | ❌ 1/4 | After explicit waitForLoadState |

**Test improvements applied:**
1. Added direct HTTP request (`page.request.get()`) before clicking — validates URL exists independently of browser click behaviour. Stabilised WebKit/Chromium.
2. Added `waitForURL(pattern, { timeout: 15000 })` and `waitForLoadState('domcontentloaded', { timeout: 15000 })` after click — gave Firefox enough settling time. Firefox now passes.

**Root cause:** The site is slow to respond under repeated sequential page loads (3 nav items in a loop, each reloading the homepage). This manifests differently per browser:
- **Firefox** — stricter DOM stability checks blocked `.click()` on elements undergoing mutations. Fixed by explicit wait giving DOM time to settle.
- **WebKit** — more sensitive to server response times; `waitForURL` times out when the server is slow to complete navigation. Still sporadic.
- **Chromium** — most tolerant of slow responses and DOM mutations; passes consistently.

**Fix:** The site needs to handle repeated sequential browser requests more reliably — consistent sub-15s navigation response times across all pages.

---

## Summary Table

| ID | Severity | Category | Summary |
|----|----------|----------|---------|
| BUG-001 | **Critical** | Infrastructure | Static assets returning 503 — CDN/server misconfiguration |
| BUG-003 | **High** | Content | Footer "Case Studies" link points to wrong URL slug (`/case-study`) |
| BUG-005 | **High** | Browser Compat | Navigation tests fail sporadically in WebKit; Firefox previously affected, resolved by explicit waits |
| BUG-002 | **Medium** | UX/Accessibility | Form required fields not marked with HTML `required` attribute |
| BUG-004 | **Medium** | Content | All 3 office "Location" links on /contact-us use `href="#"` — no map opens |
