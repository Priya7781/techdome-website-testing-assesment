# k6 Load Test Results

> Tool: k6 v2 | Constraint: max 5 concurrent users | Date: 2026-06-29

## Configuration

| Setting | Value |
|---|---|
| Virtual Users (VUs) | 5 (hard max) |
| Duration | 30s |
| Target | https://techdome.io |
| Pages tested | Homepage (/), Contact (/contact-us) |
| Script | `load/load.k6.js` |

## Results

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Overall p95 response time | 1143ms | < 3000ms | ✅ PASS |
| Homepage p95 response time | 1019ms | < 3000ms | ✅ PASS |
| Contact page p95 response time | 1174ms | < 3000ms | ✅ PASS |
| HTTP 5xx errors | 0 | 0 (zero) | ✅ PASS |
| Error rate | 0.00% | 0% | ✅ PASS |
| Total requests | 132 | — | — |
| Checks passed | 264 / 264 | — | — |

## Overall Verdict: ✅ PASS

> **Note:** k6 measures raw HTTP document response time only — it does not load JS/CSS assets. This is why 5xx errors appear as 0 even though the site's `/_app/immutable/` asset bundle returns 503 (see BUG-001). For full browser load behaviour under concurrent users, see `docs/load-test-results.md`.

## HTML Report

Full interactive report saved to `docs/k6-report.html`.
