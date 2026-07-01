import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const homepageDuration = new Trend('homepage_duration', true);
const contactDuration  = new Trend('contact_duration', true);
const errorRate        = new Rate('error_rate');

// HARD CONSTRAINT: never exceed 5 concurrent users
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_duration:  ['p(95)<3000'],  // p95 response time < 3s
    homepage_duration:  ['p(95)<3000'],
    contact_duration:   ['p(95)<3000'],
    error_rate:         ['rate==0'],     // zero errors (hard requirement)
    http_req_failed:    ['rate==0'],     // zero HTTP 5xx (hard requirement)
  },
};

const BASE_URL = 'https://techdome.io';

export default function () {
  // --- Homepage ---
  const homeRes = http.get(`${BASE_URL}/`, {
    tags: { page: 'homepage' },
  });

  homepageDuration.add(homeRes.timings.duration);

  check(homeRes, {
    'homepage: status not 5xx': (r) => r.status < 500,
    'homepage: status > 0':     (r) => r.status > 0,
    'homepage: has body':       (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);

  sleep(1);

  // --- Contact page ---
  const contactRes = http.get(`${BASE_URL}/contact-us`, {
    tags: { page: 'contact' },
  });

  contactDuration.add(contactRes.timings.duration);

  check(contactRes, {
    'contact: status not 5xx': (r) => r.status < 500,
    'contact: status > 0':     (r) => r.status > 0,
    'contact: has body':       (r) => r.body && r.body.length > 0,
  }) || errorRate.add(1);

  sleep(1);
}

export function handleSummary(data) {
  const metrics = data.metrics;

  const p95Overall  = metrics.http_req_duration.values['p(95)'].toFixed(0);
  const p95Homepage = metrics.homepage_duration.values['p(95)'].toFixed(0);
  const p95Contact  = metrics.contact_duration.values['p(95)'].toFixed(0);
  const totalReqs   = metrics.http_reqs.values.count;
  const failedReqs  = metrics.http_req_failed.values.passes;
  const checksTotal = metrics.checks.values.passes + metrics.checks.values.fails;
  const checksPassed = metrics.checks.values.passes;
  const errorRateVal = (metrics.error_rate.values.rate * 100).toFixed(2);

  const p95Pass     = parseInt(p95Overall) < 3000;
  const zeroErrors  = failedReqs === 0;
  const verdict     = p95Pass && zeroErrors ? '✅ PASS' : '❌ FAIL';

  const md = `# k6 Load Test Results

> Tool: k6 v2 | Constraint: max 5 concurrent users | Date: ${new Date().toISOString().slice(0, 10)}

## Configuration

| Setting | Value |
|---|---|
| Virtual Users (VUs) | 5 (hard max) |
| Duration | 30s |
| Target | https://techdome.io |
| Pages tested | Homepage (/), Contact (/contact-us) |

## Results

| Metric | Value | Threshold | Status |
|---|---|---|---|
| Overall p95 response time | ${p95Overall}ms | < 3000ms | ${parseInt(p95Overall) < 3000 ? '✅ PASS' : '❌ FAIL'} |
| Homepage p95 response time | ${p95Homepage}ms | < 3000ms | ${parseInt(p95Homepage) < 3000 ? '✅ PASS' : '❌ FAIL'} |
| Contact page p95 response time | ${p95Contact}ms | < 3000ms | ${parseInt(p95Contact) < 3000 ? '✅ PASS' : '❌ FAIL'} |
| HTTP 5xx errors | ${failedReqs} | 0 (zero) | ${zeroErrors ? '✅ PASS' : '❌ FAIL'} |
| Error rate | ${errorRateVal}% | 0% | ${parseFloat(errorRateVal) === 0 ? '✅ PASS' : '❌ FAIL'} |
| Total requests | ${totalReqs} | — | — |
| Checks passed | ${checksPassed} / ${checksTotal} | — | — |

## Overall Verdict: ${verdict}

## HTML Report

Full interactive report saved to \`docs/k6-report.html\`.
`;

  return {
    'docs/k6-report.html':       htmlReport(data),
    'docs/load-test-results.md': md,
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
