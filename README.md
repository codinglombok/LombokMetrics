# LombokMetrics

Zero-dependency metrics registry with Prometheus text exposition: counters, gauges, histograms, labels, canonical number formatting. Part of the Lombok Ecosystem.

## Why this library?

Every service, device, and script that exposes operational numbers needs the same format and stable output. This library keeps metrics in memory and renders exposition text with a fixed ordering and number format, identical in every language, so it is easy to test and compare.

## Features

- Counter, Gauge, Histogram with labels
- Prometheus text exposition 0.0.4 (HELP, TYPE, label escaping)
- Canonical number formatting (identical across languages)
- Deterministic output order (metrics by name, series by label values in code point order)
- Validation of metric and label names

## Use cases

- An HTTP service or worker that serves a /metrics endpoint
- A batch or cron script that writes a metrics file for a collector
- A gateway or embedded device reporting counters and temperatures
- Testing: comparing metric output exactly without depending on hash order

## Installation

Not yet published to any registry (0.1.0 has not been released). After release:

```
npm install lombokmetrics
pip install lombokmetrics
```

## API overview

- `new Registry(): counter(name, help, labelNames); gauge(name, help, labelNames); histogram(name, buckets, help, labelNames); render()`
- `Counter.inc(labels, v=1); Gauge.set(labels, v); Gauge.inc/dec(labels, v=1); Histogram.observe(labels, v)`
- `formatNumber(x) -> string`

Details: `docs/API_LombokMetrics_v0.1.0.md`.

## Port status

| Port | Status |
|---|---|
| TypeScript (reference) | YES, passes all 116 vector cases |
| Python | YES, passes all 116 vector cases |
| Rust, Go, PHP | NOT YET |

## Standards implemented

The normative contract is in `docs/SPEC_LombokMetrics_v0.1.0.md`; the vectors are in `vectors/lombokmetrics-vectors-v1.json`.

## Known limitations

- Only the 0.0.4 text format; OpenMetrics and summaries: NOT YET.
- Not thread-safe; callers serialize access.
- No limit on the number of series (label cardinality is the caller's responsibility).
- Rust, Go and PHP ports: NOT YET.

## Development

```
node --test typescript/test/vectors.test.ts   # TypeScript (Node 22+)
python -m pytest python/tests                 # Python 3.10+
node scripts/gen_vectors.ts                   # regenerate vectors from the TypeScript reference
```

## Lombok Ecosystem

Part of the [Lombok Ecosystem](https://github.com/codinglombok).

## License

Apache-2.0 OR MIT (see `LICENSE-APACHE` and `LICENSE-MIT`).
