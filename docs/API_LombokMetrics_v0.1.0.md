# API LombokMetrics v0.1.0

Reference language: TypeScript. The Python port uses snake_case names and returns tuples, dicts, or dataclasses with the same content. Stability: 0.x; changes may occur and are noted in the CHANGELOG. Since version: 0.1.0.

- `new Registry(): counter(name, help, labelNames); gauge(name, help, labelNames); histogram(name, buckets, help, labelNames); render()`
- `Counter.inc(labels, v=1); Gauge.set(labels, v); Gauge.inc/dec(labels, v=1); Histogram.observe(labels, v)`
- `formatNumber(x) -> string`

Input outside the ranges in the SPEC raises `RangeError` (TypeScript) or `ValueError` (Python); functions defined as total return a special value (null, invalid) as the SPEC states.

Cross-language compatibility: see SPEC section 3 and the vectors.
