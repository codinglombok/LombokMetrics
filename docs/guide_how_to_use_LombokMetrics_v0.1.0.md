# Usage Guide LombokMetrics

## 1. Installation

After release: `npm install lombokmetrics` or `pip install lombokmetrics`. Before release, copy the `typescript/src` folder or `python/src/lombokmetrics` (no dependencies).

## 2. Basic concepts

A Registry holds metrics. counter, gauge, and histogram are declared with a name and labels; operations use a label object that exactly matches the declaration. render() produces Prometheus text that can be served on a /metrics endpoint or written to a file.

## 3. Examples

`examples/example.ts` and `examples/example.py` produce the following output (TypeScript; Python is identical except for print formatting):

```
# HELP http_requests_total Total requests.
# TYPE http_requests_total counter
http_requests_total{code="200"} 2
http_requests_total{code="500"} 1
# HELP request_seconds Request latency.
# TYPE request_seconds histogram
request_seconds_bucket{le="0.1"} 1
request_seconds_bucket{le="0.5"} 1
request_seconds_bucket{le="1"} 2
request_seconds_bucket{le="+Inf"} 2
request_seconds_sum 0.6699999999999999
request_seconds_count 2
```

TypeScript code:

```ts
import { Registry } from "lombokmetrics";

const reg = new Registry();
const req = reg.counter("http_requests_total", "Total requests.", ["code"]);
const lat = reg.histogram("request_seconds", [0.1, 0.5, 1], "Request latency.");
req.inc({ code: "200" }, 2);
req.inc({ code: "500" });
lat.observe({}, 0.07);
lat.observe({}, 0.6);
process.stdout.write(reg.render());
```

## 4. Recipes

- /metrics endpoint: serve reg.render() with content type text/plain; version=0.0.4.
- File for a collector: write render() to a temporary file and rename it atomically.
- Testing: compare render() with the expected text; the order is stable.

## 5. Common pitfalls

- Only the 0.0.4 text format; OpenMetrics and summaries: NOT YET.
- Not thread-safe; callers serialize access.
- No limit on the number of series (label cardinality is the caller's responsibility).
- Rust, Go and PHP ports: NOT YET.

## 6. See also

`SPEC_LombokMetrics_v0.1.0.md`, `API_LombokMetrics_v0.1.0.md`, `full_summary_project_LombokMetrics_v0.1.0.md`.
