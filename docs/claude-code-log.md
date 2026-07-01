# Claude Code Usage Log

> Minimum 5 entries. Each entry documents a meaningful interaction — what was asked, what Claude produced, and the judgment call applied.

---

## Prompt #1

**What I asked:** "Please read through the assignment PDF and help me understand the requirements clearly."

**What Claude did:** Read the 9-page assignment PDF, identified all 4 deliverable parts (user story map, Playwright suite, Claude Code log, bug report), noted the hard constraint (max 5 concurrent users), and explored the existing project scaffold and techdome.io site in parallel using two sub-agents — one to map the project directory, one to fetch and analyse the live website.

**What I changed / accepted / rejected:**
Accepted the site analysis and project structure summary. The site research agent initially just created a plan without fetching — I prompted it to actually execute (good catch). The site profile it produced (nav structure, form fields, CTAs, footer links) was accurate and became the foundation for both the user story map and test selectors. I noted the agent didn't confirm analytics scripts since static fetch can't see JS-injected tags — I added a dedicated third-party test to detect this at runtime.

---

## Prompt #2

**What I asked:** "Plan the full implementation: config files, utils, test files, docs, execution order."

**What Claude did:** Produced a detailed plan covering playwright.config.ts changes, package.json scripts, utils/helpers.ts, utils/fixtures.ts, 6 E2E test files, 3 integration test files, 3 security test files, 1 load test file, and all 4 doc files. Specified key design decisions: POM for selector management, form tests validate fields without submitting to CRM, load tests capped via `--workers=5`, security headers checked via raw request API not browser.

**What I changed / accepted / rejected:**
The plan proposed using `testIgnore` on chromium/firefox/webkit projects and a dedicated `load` project. I accepted this because it cleanly separates load tests from the 3-browser matrix — without it, load tests would run 3× (one per browser) and could briefly exceed 5 concurrent users if all ran simultaneously. The decision to not submit the contact form for real (only intercept the request) I confirmed as correct — hitting a live CRM with test data in every CI run would be irresponsible. I also kept the decision to use `page.request.fetch()` for security header checks because browser DevTools suppress some headers (e.g. HSTS after the first visit).

---

## Prompt #3

**What I asked:** "Write the Page Object Model in utils/fixtures.ts — selectors for homepage and contact page."

**What Claude did:** Scaffolded `HomePage` and `ContactPage` classes using `getByRole`, `getByLabel`, and semantic locators. Also created a custom `test.extend()` fixture so tests can use `{ homePage, contactPage }` directly.

**What I changed / accepted / rejected:**
Changed the selector strategy for `socialIcons` — Claude initially used `getByRole('link', { name: /linkedin/i })` which is fragile if the icon has no visible text (SVG icons rarely do). I switched to `a[href*="linkedin"]` attribute matching, which targets the actual link destination. Similarly, for the contact form fields, `getByLabel()` is the right call (accessible and stable), but I added a `.catch(() => {})` on the optional phone field fill since that field's label text could vary. Claude used `getByRole('button')` for the submit button which I kept — it's more resilient than a CSS class selector and matches ARIA semantics.

---

## Prompt #4

**What I asked:** "Write the security test for HTTP response headers."

**What Claude did:** Created `tests/security/headers.spec.ts` with 5 tests checking X-Frame-Options, CSP, HSTS, X-Content-Type-Options, and Referrer-Policy. Used `page.request.get()` to fetch raw headers.

**What I changed / accepted / rejected:**
Claude originally wrote all 5 tests as hard `expect(...).toBeTruthy()` assertions. I softened CSP and Referrer-Policy to `console.warn` + soft check because these are common real-world findings on many production sites and their absence should be documented as bugs rather than causing a blanket test suite failure. HSTS and X-Frame-Options I kept as hard assertions since these are non-negotiable security baselines. I also added the `toUpperCase()` normalisation on X-Frame-Options because header values can be sent in any case.

---

## Prompt #5

**What I asked:** "Write the load test — exactly 5 concurrent users, p95 < 3000ms, zero 5xx."

**What Claude did:** Created `tests/load/load.spec.ts` with a `test.describe.configure({ mode: 'parallel' })` block containing exactly 5 test cases (one per user), each measuring homepage + contact page response times using `Date.now()`. Results are appended to a temp JSON file for aggregation.

**What I changed / accepted / rejected:**
Claude's initial approach tried to calculate p95 globally inside each test, but in Playwright's parallel model each worker is an isolated process with no shared memory. I changed the aggregation strategy: each test writes its timings to `docs/load-results-tmp.json` and the p95 calculation happens in the global teardown or post-test analysis script. Also, Claude used `performance.now()` initially but this is a browser-side API — the tests measure navigation time server-side, so `Date.now()` (before/after `page.goto()`) is the correct approach. I also added `--workers=5 --project=load` to the npm script as a belt-and-braces enforcement of the hard constraint, even though the 5 test cases naturally cap concurrency.

---

## Prompt #6

**What I asked:** "Review the full test suite for any flakiness risks before running."

**What Claude did:** Identified 3 potential flakiness points: (1) `waitForLoadState('networkidle')` can time out on pages with long-polling analytics; (2) mobile hamburger selectors are fragile across different CSS class naming conventions; (3) the LCP measurement uses a 5-second `setTimeout` which adds unnecessary test time.

**What I changed / accepted / rejected:**
Accepted all three findings. For `networkidle` I kept `domcontentloaded` in most tests and only used `networkidle` in third-party and performance tests where it's meaningful. For mobile hamburger detection, I widened the selector to cover multiple class naming patterns (`[class*="hamburger"]`, `[class*="menu-toggle"]`, `button[aria-label*="menu" i]`) and added a fallback: if no hamburger exists but the desktop nav is also hidden, that still satisfies the responsive test. For LCP, I added an early-exit `if (lcp > 0)` guard so the test doesn't fail when the LCP API doesn't fire (e.g. headless Webkit).

---

## Prompt #7

**What I asked:** "After running the tests, help me document the bugs found."

**What Claude did:** Structured the `docs/bugs.md` file from the actual test output, categorising each failure by severity (Critical/High/Medium/Low) with reproduction steps, expected vs actual behaviour, and evidence links to the test trace/screenshot.

**What I changed / accepted / rejected:**
Claude's initial bug descriptions were accurate but overly technical ("HTTP response header absent from fetch()"). I rewrote them in product-facing language: "Site missing X-Frame-Options security header — clickjacking risk." Severity judgements were mostly correct; I upgraded BUG-002 from Medium to High because a missing HSTS header on a business site with form submission is a meaningful security degradation, not just a best-practice miss.

---

## Prompt #8

**What I asked:** "The scripts which are failing, have you kept them intentionally?"

**What Claude did:** Analysed the first test run (79 pass / 65 fail) and identified two classes of failure: intentional failures from real site bugs (security headers, 503 assets, missing `required` attrs, LCP, 404 on AI solutions page) and unintentional cascade failures caused by the site's 503 on JS/CSS assets preventing `page.goto('/', { waitUntil: 'load' })` from completing. Claude proposed fixing the cascade failures by switching all navigations to `{ waitUntil: 'domcontentloaded' }`.

**What I changed / accepted / rejected:**
Accepted the `domcontentloaded` strategy. This is the correct trade-off: `domcontentloaded` fires when the HTML is parsed, even if asset requests are still pending — it lets tests run against the SSR-rendered HTML shell without being blocked by 503 asset loads. Specifically changed 5 test files: homepage, navigation, cta-links, mobile-375, mobile-768. After re-running, the suite improved to 91 pass / 53 fail.

---

## Prompt #9

**What I asked:** [Implicit — reading the second test run output to categorise remaining failures]

**What Claude did:** Read the full second run output (144 tests across 3 browsers) and categorised the 53 remaining failures:
- **Intentional (real bugs):** Security headers missing (9 assertions × 3 browsers), 503 asset cascade (3rd-party tests), missing form `required` attrs, missing Privacy Policy/Terms links in footer, AI solutions 404, Blog page 503, LCP > 4s.
- **Test bugs to fix:** `injection.spec.ts` tests 1 and 3 timed out on `submitBtn.click()` — the submit button doesn't render without JS hydration (cascade from BUG-001). Same issue in `form-submission.spec.ts` test 1.

**What I changed / accepted / rejected:**
Added `isVisible()` guard + `.catch(() => {})` to the 3 affected submit-button click calls (matching the pattern already used in injection test 2 from Prompt #6). Also changed their `goto` calls from `page.goto('/contact-us') + waitForLoadState('domcontentloaded')` to a single `page.goto('/contact-us', { waitUntil: 'domcontentloaded' })` — the two-step pattern means `goto` still times out at 30s waiting for `load` before reaching `waitForLoadState`.

Added two new bugs to `docs/bugs.md`:
- BUG-012: Privacy Policy / Terms of Use missing from footer (confirmed by Chromium where SSR HTML renders)
- BUG-013: /blog-and-article and other pages returning 503 on the full HTML (not just assets) — broader infrastructure issue than BUG-001.

---

## Prompt #10

**What I asked:** "I shared a screenshot of a 500 Internal Error on the About Us page — assert this and fail the test case." Followed later by: "Those two tests are actually passing when I browse manually through my Chrome profile but fail through automation" + an incognito screenshot showing the page loading fine.

**What Claude did:** First pass added a hard assertion that the body text must not contain "500 Internal Error", which correctly failed the test. After I provided evidence the page renders fine in a clean browser session, Claude diagnosed the real cause: techdome.io is a SvelteKit SPA that briefly shows a transient 500 state during client-side route transitions, before JS hydrates and the real content replaces it — my cached Chrome profile loaded the JS bundle from cache (fast hydration), while automation hit it fresh and caught the transient state.

**What I changed / accepted / rejected:**
Accepted the diagnosis and the fix: replaced the body-text check with `await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })`, which waits for real rendered content instead of asserting on a string that can be transiently true. This removed two false-positive bugs (originally logged as BUG-014/BUG-015) from `docs/bugs.md` — they weren't real defects, just a race condition in the test's assertion timing. I kept the same pattern for the new "Careers" CTA test I requested in the same prompt, using `//header//a[normalize-space()='Careers']` as the locator.

---

## Prompt #11

**What I asked:** "I want to navigate to the footer Case Studies link — use `getByRole` and check it." Followed by a screenshot showing the link leads to an "Oops! Page Not Found" page that auto-redirects home after 3 seconds.

**What Claude did:** First version checked `responseStatus < 400` and that the body text didn't match `/page not found/i` or `/oops/i`. Later, when asked to simplify, Claude switched to `getByText('Case Studies')` after the click — but this passed incorrectly because the 404 page's own footer also contains a "Case Studies" link, so the text was technically present even on the broken page.

**What I changed / accepted / rejected:**
Rejected the loose `getByText` check once I pointed out it was passing when it should fail. Tightened the assertion to target the page's actual `h1`/`h2` heading specifically (not just any matching text anywhere on the page), and ultimately settled on directly asserting the `h1` "Oops! Page Not Found" is visible — this documents BUG-016 as a known-bug regression test: it passes while the bug exists and will fail (correctly) once the link is fixed, which is the right shape for tracking a confirmed defect rather than re-discovering it every run.

---

## Prompt #12

**What I asked:** "Click the hamburger icon at 768px then click Contact Us" → after it failed: investigate why Contact Us isn't reachable after opening the hamburger menu.

**What Claude did:** Found that at the 768px breakpoint (Tailwind `md`), the mobile menu toggle requires JS to open, and that JS never loads due to the site's 503 on `/_app/immutable/` assets (BUG-001) — so the click on the hamburger icon never actually opens the menu, leaving "Contact Us" permanently hidden.

**What I changed / accepted / rejected:**
Accepted that this isn't testable as a click-through interaction under the current site conditions, since the JS hydration itself is broken (a separate confirmed bug). Replaced the test with direct navigation to `/contact-us` to verify the page itself renders correctly at 768px, and added the same office-location-links check (3 offices, `href="#"`) I'd already written for the 375px viewport, referencing the existing BUG-017 rather than filing a duplicate.

---

## Prompt #13

**What I asked:** "`npx playwright test` fails with `Cannot find module 'k6/http'`" → "Keep `load.k6.js` outside the tests folder" → "Tests pass with 1 worker but fail with multiple — suggest a workaround" → "Do option 2 (workers: 2, retries: 1)" → later: "Change the workers to 5 and run."

**What Claude did:** Diagnosed that Playwright was picking up the k6 script as a test file since it lived under `tests/load/`. Initial fix added a `testIgnore` glob; per my instruction, Claude instead physically moved the file to a root-level `load/` directory and removed the now-unnecessary `testIgnore`, updating `package.json`'s `test:load:k6` script path to match. For the worker-instability question, Claude offered two options (lower concurrency vs. higher retries) and implemented the one I picked.

**What I changed / accepted / rejected:**
Accepted moving the k6 file out of `tests/` as the cleaner long-term fix over excluding it by pattern — one less config rule to maintain. Later overrode the `workers: 2` setting back up to `5` specifically for the Playwright load test, since the assignment's hard constraint is "exactly 5 concurrent users" — running it at 2 workers wasn't actually exercising the real concurrency scenario the test was designed to catch.

---

## Prompt #14

**What I asked:** "Why is the load test failing?" → "But it's passing with k6" → "This file should store `load.spec.ts` results — create a separate file for k6" → "Is it updating `load-test-results.md` automatically now?"

**What Claude did:** Explained the divergence: k6 is a pure HTTP client that never loads JS/CSS/image assets, so it never sees the 503s on `/_app/immutable/` that a real browser triggers under concurrent load — Playwright's load test, using actual browser sessions, correctly exposed that the site degrades under 5 concurrent real users (multiple 503s, p95 > 3000ms). Claude split the single `docs/load-test-results.md` into two files — one for Playwright browser-based load results, one for k6 HTTP-only results — and added a `test.afterAll` hook to `load.spec.ts` that reads the accumulated temp JSON and regenerates the markdown report automatically after every run, rather than requiring manual transcription.

**What I changed / accepted / rejected:**
Accepted the two-file split and the auto-generation hook. This was a case where Claude's existing approach (a single shared file, manually filled in) created a discrepancy I noticed in passing ("the file should store load.spec.ts results too") — fixing it removed a manual step that would otherwise have gone stale every time the suite re-ran with different timing results.

---

## Prompt #15

**What I asked:** "Can you give me the command name to run all the tests together and for load.spec.ts I need 5 workers" → "But I need only one report" → "Don't keep load.spec.ts in test:all" → "Now do npm run test:all and update all the .md files accordingly."

**What Claude did:** Explained that Playwright's `workers` setting is global — it cannot differ per project within one invocation. The solution was two separate npm scripts: `test:all` runs chromium+firefox+webkit at `workers: 1` (load excluded via `testIgnore`), and `test:load` always runs at `--workers=5`. For the single-report requirement, Claude initially wired up Playwright's blob reporter + `merge-reports` to combine both runs into one HTML file. When I clarified load tests should be excluded from `test:all` entirely, Claude simplified the script to a direct 3-browser invocation with the standard HTML reporter — no blob merge needed. Then ran `npm run test:all` and updated all docs from the live results.

**What I changed / accepted / rejected:**
The live run (147 tests, 128 pass, 19 fail) produced several significant findings: 6 bugs previously documented as failures now **pass** (BUG-002, BUG-003, BUG-008, BUG-009, BUG-010, BUG-012 — security headers, meta description, overflow, legal links all fixed on the live site). A new bug was found: **BUG-018** — Firefox-specific element instability ("not stable") causing 9 additional test failures that don't occur in Chromium. Root cause traces back to BUG-001: Firefox handles repeated SvelteKit hydration failures with stricter DOM stability checks, blocking click actions entirely. The Case Studies link evidence also improved: Firefox's error log revealed the footer link href is `/case-study` (singular) vs the working `/case-studies/` (plural) — a clear typo in the site's footer data.

---

## Prompt #16

**What I asked:** "Remove all the fixed and not reproduced bugs" → "Keep the bug number in serial" → "Apart from bug 006 and 007, from where all the bugs are originating and how and can they be fixed?"

**What Claude did:** Removed all fixed and not-reproduced entries from `docs/bugs.md`, leaving only the 8 open bugs, then renumbered them BUG-001 through BUG-008 in serial order with all internal cross-references updated. For the root cause analysis, Claude grouped the remaining bugs into three origin clusters: (1) server/CDN misconfiguration — BUG-001, and security header gaps; (2) BUG-001 cascades — LCP and Firefox instability have no independent root cause and auto-resolve when BUG-001 is fixed; (3) frontend code — the missing `required` attributes are a developer-side fix independent of the server.

**What I changed / accepted / rejected:**
Accepted the root cause grouping. The key insight I found valuable: fixing BUG-001 alone would cascade-resolve several other bugs (LCP, Firefox instability), so the effective remediation list is shorter than the bug count suggests. I also directed a more targeted cleanup — asking where each individual bug originated led to discovering that BUG-004 (LCP) had no active test (the LCP test was removed earlier), and neither did the X-Content-Type-Options or Referrer-Policy bugs. All three were removed from the report since a bug with no automated test backing has no ongoing detection — it's noise rather than signal.

---

## Prompt #17

**What I asked:** "From where did the BUG-001 originated from? which test case" → "so run" [selected `tests/integration/third-party.spec.ts` in IDE] → "so that is appeared only when load.spec.ts is being run?"

**What Claude did:** Traced BUG-001 to two test cases in `third-party.spec.ts`: `no 5xx errors from any network request during page load` (line 23) and `page loads without render-blocking failures` (line 4). Ran `third-party.spec.ts` alone with 1 worker across all 3 browsers — all 12 tests passed cleanly. Then explained that the 503s on `/_app/immutable/` assets only appear when 5 concurrent real browser sessions hit the CDN/origin simultaneously; a single browser session never triggers them.

**What I changed / accepted / rejected:**
Accepted the single-worker run as the definitive confirmation that BUG-001 is load-triggered, not a constant failure. This distinction matters for the bug report: it's not that the site is always broken, it's that the CDN buckles under concurrent load. I directed Claude to update BUG-001 with this finding and also noted a minor Firefox `_fontshare_key` SameSite cookie warning observed in the run — it passed under the <5 error threshold and was not filed as a new bug.

---

## Prompt #18

**What I asked:** "Can you update the bug 1" → "Just run the load test using 5 workers and update them" → "Can you run again?" → "Can you update that in BUG 1 as well"

**What Claude did:** Ran `npm run test:load` twice (5 Playwright workers each). Run 1: all 5 users failed — a mix of 503s on homepage and /contact-us, plus one navigation timeout (User 3, 5866ms). Run 2: cleaner but still all 5 failed — /contact-us returned 503 for 4 of 5 users, and User 4 had an SLA breach at 3613ms even though both pages returned 200. Updated BUG-001 with two side-by-side result tables documenting both runs and added the conclusion that `/contact-us` is the weaker endpoint.

**What I changed / accepted / rejected:**
The `test.afterAll` auto-hook only wrote data from 3 of 5 workers in Run 1 (workers 1 and 4 crashed on the homepage assertion before writing their results). I manually corrected the markdown table to include all 5 users' data derived from the console output. This revealed a limitation: the temp-file aggregation assumes all workers reach the write step, which isn't guaranteed under server errors. I accepted the current implementation as acceptable for the assignment scope and noted the limitation in the log.

---

## Prompt #19

**What I asked:** "What is bug 005 from where is it's originating?" → "now run all those test files which you mentioned above only in firefox" → [pasted `cta-links.spec.ts`] "Run this file and validate bug 05" → "Bug 005 is caused by what what is the source"

**What Claude did:** Traced BUG-005 to `navigation.spec.ts` — specifically the `nav links resolve without 404 or blank page` test which clicks nav links in a loop and calls `waitForURL`. Identified that BUG-005's root cause is distinct from BUG-001: it's Firefox's stricter DOM stability checks blocking `.click()` on elements undergoing continuous mutations during SvelteKit hydration. Also ran `cta-links.spec.ts` in Firefox — it passed all 7 tests, confirming BUG-005 is specific to the navigation loop test pattern, not a general Firefox issue.

**What I changed / accepted / rejected:**
The initial analysis listed BUG-001 as a dependency of BUG-005. I challenged this because CTA links (which also click nav-style links in Firefox) passed fine — meaning the instability is loop-specific, not a Firefox-wide click failure. I accepted Claude's refined explanation: the `for` loop in `navigation.spec.ts` reloads the homepage between each link click, causing repeated SvelteKit hydration attempts and accumulating DOM mutation events that Firefox's stability threshold blocks.

---

## Prompt #20

**What I asked:** [pasted `navigation.spec.ts`] "so run" → "Can you run again and try" → "It's sporadic i think" → "Now just mention all these details in Bug 005" → "Can we remove bug 001 from here as dependency in bug 005"

**What Claude did:** Ran `navigation.spec.ts` across all 3 browsers twice. Pattern was consistent: Chromium always passed 4/4, Firefox failed 2/4 with element-stability timeouts (and in one run crashed entirely with code `3221226505` — Windows access violation), WebKit failed sporadically with `waitForURL` timeout. Updated BUG-005 with a 3-run table and the per-browser failure characterisation. Removed BUG-001 from the dependency section after I confirmed the behaviors are independently rooted.

**What I changed / accepted / rejected:**
Accepted the sporadic classification after running twice and seeing the same pattern. The Firefox worker crash (`3221226505`) was an unexpected finding — it's a Windows access violation inside the Firefox process under heavy server stress, not a Playwright bug. I accepted documenting it as evidence of server-side stress impact rather than filing it as a new test code bug.

---

## Prompt #21

**What I asked:** [pasted updated nav test with HTTP pre-check] "I added this code snippet instead of the previous one. Is this fine?" → "Yes" [run on all 3 browsers] → "run again check that it's consistent" → "Can you use explicit wait here" [selected the `waitForURL` lines] → "yes" [run again to verify] → "Now update bug 005" → "Ok can you update this thing in defect 005"

**What Claude did:** Reviewed the HTTP pre-check addition (`page.request.get(targetUrl)` before `link.click()`) and confirmed it was a valid improvement — it validates the URL resolves independently of browser click behavior. Ran all 3 browsers twice with the new code: WebKit stabilised (4/4), Firefox still failed 2/4 on the `link.click()` stability check. Added `waitForLoadState('domcontentloaded', { timeout: 15000 })` after `link.click()` based on the selected lines. Ran again — Firefox stabilised (4/4), only WebKit remained sporadically failing. Updated BUG-005 with a 6-run table showing the full progression.

**What I changed / accepted / rejected:**
The two-step improvement was iterative: my HTTP pre-check fixed WebKit but not Firefox; Claude's explicit wait suggestion fixed Firefox but WebKit remains sporadic. This is a meaningful finding — different browsers needed different remedies for what looked like the same symptom. The final BUG-005 state accurately reflects that WebKit's `waitForURL` timeout is a server-side response-time issue, not fixable by test-side waits alone.

---

## Prompt #22

**What I asked:** [attached assignment PDF] "Do one thing update my readme.md in such way that: if users want to perform load test they can either use k6 — mention the respective command. Or if they want to use playwright workers for load test they can use workers as 5 and run the test. If they want to run other things apart from load they can use npx playwright test using 1 worker, as maximum test cases passed using one worker. If it is not asked in the pdf, remove the workflow file. Update the user stories accordingly to the test I have created in the tests folder."

**What Claude did:** Fully rewrote `README.md` with two load-test options (Option 1: `npm run test:load` — Playwright 5 workers; Option 2: `npm run test:load:k6` — k6 HTTP-only), a comparison table explaining why the two tools give different results, and the non-load test command (`npx playwright test --workers=1`). Checked the assignment PDF — GitHub Actions workflow was not required, so deleted `.github/workflows/playwright.yml`. Started writing the updated `user-story-map.md` aligned to actual test implementations.

**What I changed / accepted / rejected:**
Accepted the README rewrite. The two-option load section was exactly what I wanted — it explains the trade-off (real browser vs HTTP-only) rather than just listing commands, which is more useful for a reviewer evaluating the suite. The workflow file deletion was straightforward: the PDF's deliverables section doesn't mention CI/CD, so keeping it would have been noise.

---

## Prompt #23

**What I asked:** "Did you read the user story mapping from document or how it should be" [interrupted the user-story-map.md write mid-way] → "Ok just do it, but I want that the tests which are covered my test cases only those it should be kept in user-story-map.md"

**What Claude did:** Explained that the existing user-story-map.md already followed the PDF template format correctly (US-001, Title, As a, I want to, So that, Acceptance, Test Type, Priority). The planned update was to align the acceptance criteria inside each story to match what the actual implemented tests check, rather than keeping generic intent-based criteria. Rewrote `user-story-map.md` with 15 stories (removed the un-implemented data exposure story, merged load US-016 → US-015), each one mapping directly to specific test file paths and test names with acceptance criteria that mirror the actual assertions.

**What I changed / accepted / rejected:**
Confirmed the approach: stories must reflect what was actually implemented, not what the original plan intended. The key removals were: US-015 (data exposure — `data-exposure.spec.ts` was never written, so there's no test backing it), and the old US-016 renumbered to US-015. This brought the total to 15 stories — still above the PDF's minimum of 14 — covering all required categories.

---

## Prompt #24

**What I asked:** "add all my prompts to claude code which I have given to you"

**What Claude did:** Read the full `docs/claude-code-log.md`, cross-referenced the session summary covering all prompts from the previous context window, and appended entries #17 through #24 documenting every interaction not yet logged — BUG-001 origin investigation, two load test runs, BUG-005 root cause trace, navigation test improvements (HTTP pre-check and explicit wait), README rewrite, workflow file deletion, and user-story-map update.

**What I changed / accepted / rejected:**
Accepted format unchanged from existing entries — each entry follows the same structure (What I asked / What Claude did / What I changed). Combined closely related short follow-up prompts (confirmations, re-runs) into single entries to keep the log readable rather than fragmenting each "ok" into its own entry.

