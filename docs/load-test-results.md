# Load Test Results

## Summary

| Metric | Value |
|---|---|
| Concurrent users | 5 |
| Total requests | 10 |
| p95 response time | 3613 ms |
| SLA | < 3000 ms |
| HTTP 5xx errors | 5 |
| Result | ❌ FAIL |

## Detailed Results

| User | Page | Status | Response Time | Error |
|---|---|---|---|---|
| 5 | / | 503 | 126 ms | - |
| 1 | / | 200 | 1241 ms | - |
| 5 | /contact-us | 503 | 59 ms | - |
| 1 | /contact-us | 503 | 73 ms | - |
| 3 | / | 200 | 1254 ms | - |
| 3 | /contact-us | 503 | 61 ms | - |
| 2 | / | 200 | 1547 ms | - |
| 2 | /contact-us | 503 | 48 ms | - |
| 4 | / | 200 | 2363 ms | - |
| 4 | /contact-us | 200 | 3613 ms | - |
