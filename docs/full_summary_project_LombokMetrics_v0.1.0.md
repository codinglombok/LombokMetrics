# Project Summary LombokMetrics

## What it is

Zero-dependency metrics registry with Prometheus text exposition: counters, gauges, histograms, labels, canonical number formatting. Part of the Lombok Ecosystem.

## Why it exists

Every service, device, and script that exposes operational numbers needs the same format and stable output. This library keeps metrics in memory and renders exposition text with a fixed ordering and number format, identical in every language, so it is easy to test and compare.

## Main features

- Counter, Gauge, Histogram with labels
- Prometheus text exposition 0.0.4 (HELP, TYPE, label escaping)
- Canonical number formatting (identical across languages)
- Deterministic output order (metrics by name, series by label values in code point order)
- Validation of metric and label names

## Current status

Version 0.1.0, not yet released. TypeScript and Python pass 116 vector cases. No other ports exist.

## Example use cases

- An HTTP service or worker that serves a /metrics endpoint
- A batch or cron script that writes a metrics file for a collector
- A gateway or embedded device reporting counters and temperatures
- Testing: comparing metric output exactly without depending on hash order

## Known Limitations

- Only the 0.0.4 text format; OpenMetrics and summaries: NOT YET.
- Not thread-safe; callers serialize access.
- No limit on the number of series (label cardinality is the caller's responsibility).
- Rust, Go and PHP ports: NOT YET.

## Further information

SPEC: `SPEC_LombokMetrics_v0.1.0.md`; API: `API_LombokMetrics_v0.1.0.md`; guide: `guide_how_to_use_LombokMetrics_v0.1.0.md`.

## Gap versus comparable libraries

Comparable: the Prometheus client libraries (Go, Python, Node), metrics-rs. Honest gap: no process/runtime collectors, summaries, or OpenMetrics; strengths: identical output across languages and a small, dependency-free footprint.
