# User Story Map — techdome.io

> Stories derived from actual test cases implemented in the `tests/` folder.

---

## US-001

**Title:** Homepage loads with correct branding and content
**As a:** visitor
**I want to:** land on a well-structured homepage that clearly communicates Techdome's offering
**So that:** I can quickly understand what the company does and where to go next
**Acceptance:**
- [ ] Page title contains "Techdome"
- [ ] Hero section (first `<section>`) is visible above the fold
- [ ] Meta description tag has non-empty content (>10 characters)

**Test Type:** E2E
**Priority:** P0
**Test File:** `tests/e2e/homepage.spec.ts`
**Test Cases:** `has correct page title` · `hero section is visible` · `meta description is present`

---

## US-002

**Title:** Primary navigation links resolve without errors
**As a:** visitor
**I want to:** click nav items (About Us, Careers, Contact Us) and reach the correct pages
**So that:** I can explore the site without hitting errors or blank pages
**Acceptance:**
- [ ] All primary nav links (About Us, Careers, Contact Us) are present and visible in the header
- [ ] Each nav link has a valid `href` attribute
- [ ] Direct HTTP GET to each link's target returns status < 400
- [ ] Clicking each nav link navigates to the correct URL pattern within 15s
- [ ] Page body has visible content (>20 characters) after navigation

**Test Type:** E2E
**Priority:** P0
**Test File:** `tests/e2e/navigation.spec.ts`
**Test Cases:** `all primary nav links are present and visible` · `nav "links" resolve without 404 or blank page`

---

## US-003

**Title:** No broken internal links across the site
**As a:** visitor
**I want to:** click any internal link without hitting a dead end
**So that:** I can navigate freely without frustration
**Acceptance:**
- [ ] Zero internal links on the homepage return HTTP 404 (first 15 unique links checked)
- [ ] Browser back button after nav click returns to techdome.io

**Test Type:** E2E
**Priority:** P1
**Test File:** `tests/e2e/navigation.spec.ts`
**Test Cases:** `no broken internal links return 404` · `browser back button works after navigation`

---

## US-004

**Title:** Contact form accepts valid input in all fields
**As a:** prospect
**I want to:** fill the contact form with valid data
**So that:** my enquiry can be sent to Techdome
**Acceptance:**
- [ ] Contact page loads with "Send Message" button visible
- [ ] All fields (Company, First Name, Last Name, Email, Mobile, Message) accept and retain input
- [ ] Message textarea accepts text and its character-limit behaviour is observable

**Test Type:** E2E
**Priority:** P0
**Test File:** `tests/e2e/contact-form.spec.ts`
**Test Cases:** `contact page loads with form visible` · `all form fields accept valid input` · `message textarea has character limit feedback`

---

## US-005

**Title:** Contact form enforces required field validation
**As a:** visitor
**I want to:** see clear feedback when I submit the form with empty or invalid fields
**So that:** I know which fields to fix before sending
**Acceptance:**
- [ ] Submitting an empty form does not navigate away from /contact-us
- [ ] Form inputs carry `required` attributes (browser-native fallback for JS-disabled environments)
- [ ] Email field with a non-email string keeps the page on /contact-us (submission blocked)

**Test Type:** E2E
**Priority:** P0
**Test File:** `tests/e2e/contact-form.spec.ts`
**Test Cases:** `required fields show validation on empty submit` · `email field rejects invalid format`

---

## US-006

**Title:** Primary CTAs route to the correct destination
**As a:** prospect
**I want to:** click "Contact Us", "About Us", and "Careers" links
**So that:** I land on the right page each time
**Acceptance:**
- [ ] "Contact Us" header link navigates to /contact-us
- [ ] "About Us" link navigates to /about-us with a visible heading
- [ ] "Careers" link navigates to /careers with a visible heading

**Test Type:** E2E
**Priority:** P0
**Test File:** `tests/e2e/cta-links.spec.ts`
**Test Cases:** `"Contact Us" CTA navigates to /contact-us` · `"About Us" CTA or link navigates correctly` · `"Careers" CTA or link navigates correctly`

---

## US-007

**Title:** Footer links and social icons are present and functional
**As a:** visitor
**I want to:** use footer links and social icons to explore Techdome further
**So that:** I can find the information I need or connect on social media
**Acceptance:**
- [ ] Footer contains >5 links; first 10 links do not have `href="#"`
- [ ] At least 3 of 5 platforms (LinkedIn, Instagram, YouTube, Twitter, Facebook) have valid `https://` hrefs
- [ ] "Case Studies" footer link navigates to a page with a "Case Studies" heading
- [ ] Privacy Policy and Terms of Use links are visible in the footer

**Test Type:** E2E
**Priority:** P1
**Test File:** `tests/e2e/cta-links.spec.ts`
**Test Cases:** `footer links are present and not broken` · `social media icon links are present with valid hrefs` · `"Case Studies" footer link navigates correctly` · `Privacy Policy and Terms of Use links exist in footer`

---

## US-008

**Title:** Mobile layout (375px) renders without overflow or clipping
**As a:** visitor on a mobile device
**I want to:** browse techdome.io on a 375px screen
**So that:** content is readable and navigation is accessible
**Acceptance:**
- [ ] No horizontal scrollbar overflow at 375×812 viewport
- [ ] Hamburger menu icon is visible OR desktop nav is hidden at 375px
- [ ] Hero content section is visible without scrolling
- [ ] No `h1`/`h2`/`p` element's width exceeds the viewport width
- [ ] No image's rendered width exceeds 375px
- [ ] Contact page location links attempt navigation on click

**Test Type:** E2E
**Priority:** P1
**Test File:** `tests/e2e/mobile-375.spec.ts`
**Test Cases:** `no horizontal overflow at 375px` · `navigation collapses to hamburger menu at 375px` · `hero content is visible without scrolling at 375px` · `text is readable (not clipped) at 375px` · `images are scaled appropriately at 375px (no overflow)` · `office location links on /contact-us navigate to a map at 375px`

---

## US-009

**Title:** Tablet layout (768px) renders correctly
**As a:** visitor on a tablet
**I want to:** browse techdome.io on a 768px screen
**So that:** content adapts appropriately to the tablet form factor
**Acceptance:**
- [ ] No horizontal overflow at 768×1024 viewport
- [ ] Body text length >50 chars — page renders actual content
- [ ] Desktop nav is hidden and hamburger icon is visible at 768px
- [ ] No image's rendered width exceeds 768px
- [ ] /contact-us loads correctly at 768px with location links present

**Test Type:** E2E
**Priority:** P1
**Test File:** `tests/e2e/mobile-768.spec.ts`
**Test Cases:** `no horizontal overflow at 768px` · `page renders with visible content at 768px` · `navigation is accessible at 768px` · `images are scaled appropriately at 768px (no overflow)` · `contact-us page is accessible at 768px`

---

## US-010

**Title:** Contact form POST triggers a correct network request
**As a:** QA engineer
**I want to:** verify that form submission fires a POST with the expected payload and no server error
**So that:** I know the frontend is correctly communicating with the backend
**Acceptance:**
- [ ] Submitting the form fires a POST request (or logs a warning if client-side validation blocks it)
- [ ] Captured POST body is non-empty
- [ ] No response with status ≥500 is received during contact page load

**Test Type:** Integration
**Priority:** P0
**Test File:** `tests/integration/form-submission.spec.ts`
**Test Cases:** `contact form triggers a network request on submit with expected payload` · `contact form response does not return 5xx error`

---

## US-011

**Title:** All primary pages return the expected HTTP status codes
**As a:** QA engineer
**I want to:** verify all primary pages return the correct HTTP status
**So that:** there are no silently broken pages
**Acceptance:**
- [ ] `/`, `/about-us`, `/contact-us`, `/careers`, `/blog-and-article` all return HTTP 200
- [ ] Solution sub-pages return 200, 301, or 302
- [ ] Unknown routes return 404 or are handled by the SPA

**Test Type:** Integration
**Priority:** P0
**Test File:** `tests/integration/page-status.spec.ts`
**Test Cases:** `all primary pages return HTTP 200` · `solution pages return HTTP 200 or 301/302 redirect` · `404 page exists for unknown routes`

---

## US-012

**Title:** Third-party scripts do not block page render
**As a:** visitor
**I want to:** the page to load completely without third-party resource failures
**So that:** I see content as fast as possible and the page is fully functional
**Acceptance:**
- [ ] Zero failed script or stylesheet requests during homepage load
- [ ] Zero HTTP 5xx responses from any resource during homepage load
- [ ] "Send Message" button is visible while Google Maps iframe loads on /contact-us
- [ ] Fewer than 5 non-extension console errors on homepage load

**Test Type:** Integration
**Priority:** P1
**Test File:** `tests/integration/third-party.spec.ts`
**Test Cases:** `page loads without render-blocking failures` · `no 5xx errors from any network request during page load` · `Google Maps iframe loads on contact page without blocking main content` · `page has no console errors on homepage load`

---

## US-013

**Title:** HTTP security headers are present
**As a:** security-conscious user / auditor
**I want to:** techdome.io to send proper security headers
**So that:** browsers are protected from clickjacking, MIME sniffing, and protocol downgrade
**Acceptance:**
- [ ] `X-Frame-Options` header is present with value `DENY` or `SAMEORIGIN`
- [ ] `Content-Security-Policy` header is present
- [ ] `Strict-Transport-Security` header is present

**Test Type:** Security
**Priority:** P0
**Test File:** `tests/security/headers.spec.ts`
**Test Cases:** `X-Frame-Options header is present` · `Content-Security-Policy header is present` · `Strict-Transport-Security header is present`

---

## US-014

**Title:** Contact form rejects script injection without executing it
**As a:** security tester
**I want to:** submit XSS payloads in the contact form fields
**So that:** I can verify the site sanitises or rejects malicious input
**Acceptance:**
- [ ] `<script>alert(1)</script>` in name/company fields does not fire a browser alert dialog
- [ ] XSS payload in the email field does not fire a browser alert dialog
- [ ] XSS payload in the message textarea does not fire a browser alert dialog

**Test Type:** Security
**Priority:** P0
**Test File:** `tests/security/injection.spec.ts`
**Test Cases:** `contact form rejects / sanitises script injection in name field` · `XSS payload in email field does not execute` · `textarea rejects script injection without executing it`

---

## US-015

**Title:** Site handles 5 concurrent users within response time SLA
**As a:** site owner
**I want to:** the site to respond within 3 seconds for 5 simultaneous users
**So that:** user experience is maintained under light concurrent load
**Acceptance:**
- [ ] 5 concurrent Chromium browser sessions load homepage and /contact-us simultaneously
- [ ] p95 response time < 3,000 ms across all 10 requests
- [ ] Zero HTTP 5xx errors during the concurrent run
- [ ] All 5 users receive non-zero status responses (no timeouts)

**Test Type:** Load
**Priority:** P1
**Test File:** `tests/load/load.spec.ts`
**Test Cases:** `User 1 — homepage and contact page load within SLA` through `User 5 — homepage and contact page load within SLA`

---

## Coverage Summary

| Area | Stories | Test Type | Minimum Met |
|------|---------|-----------|-------------|
| Navigation & page load | US-001, US-002, US-003 | E2E | ✅ (3 ≥ 2) |
| Contact / enquiry form | US-004, US-005 | E2E | ✅ (2 ≥ 2) |
| CTAs & external links | US-006, US-007 | E2E | ✅ (2 ≥ 2) |
| Mobile responsiveness | US-008, US-009 | E2E | ✅ (2 ≥ 2) |
| API / form integration | US-010, US-011, US-012 | Integration | ✅ (3 ≥ 3) |
| Security headers & injection | US-013, US-014 | Security | ✅ (2 ≥ 2) |
| Load (≤5 users) | US-015 | Load | ✅ (1 ≥ 1) |
| **Total** | **15** | | ✅ (15 ≥ 14) |
