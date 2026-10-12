# SPEC LombokMetrics v0.1.0

This document is the normative cross-language contract. Every language port MUST produce byte-identical output for all specified inputs. Deviations from this specification are bugs.

The keywords MUST, SHOULD and MAY are to be read as in RFC 2119. Last reviewed: 2026-10-07.

## 0. Reference standards

This library defines its own contract; there is no normative external standard except those named in the relevant sections.

## 1. Vectors

| File | Cases | SHA-256 |
|---|---|---|
| `vectors/lombokmetrics-vectors-v1.json` | 116 | `f416bb60ba2297601acef68806fa1de104872d9e522f0d64c0c8b5e3eee1928b` |

## 2. Contract

1. A metric name matches ^[a-zA-Z_:][a-zA-Z0-9_:]*$ and is unique; a label name matches ^[a-zA-Z_][a-zA-Z0-9_]*$, does not start with '__', is unique, and 'le' is forbidden on histograms.
2. A Counter accepts only finite increments >= 0; a Gauge does not accept NaN; Gauge inc/dec MUST be finite; a Histogram accepts finite values. Bucket bounds are finite and strictly increasing; the +Inf bucket is implicit.
3. The labels in an operation MUST exactly match the declared label names, with string values. A metric without labels has a series with value 0 from creation; a labelled metric creates a series on first use.
4. render: metrics sorted by name (code point order); each metric writes `# HELP` (omitted when help is empty; backslash and LF escaped) then `# TYPE`, then series sorted by their list of label values in code point order. Labels are written in declaration order with backslash, double quote and LF escaped in values. Every line ends with LF; an empty registry renders the empty string.
5. Histogram: for each series write cumulative `_bucket{...,le="b"}` for every bound, `le="+Inf"`, then `_sum` and `_count`. A value v falls into the first bucket whose bound is >= v.
6. formatNumber: NaN, +Inf, -Inf; zero (including -0) becomes 0; otherwise the shortest digits that read back exactly, decimal notation when 1e-5 <= |x| < 1e15, otherwise d.ddde+XX with an exponent of at least two digits.

## 3. Cross-language representation

String indexes and lengths are counted in code points; floating-point numbers use IEEE 754 doubles with the order of operations as written; large integers MUST NOT lose precision.

## 4. Non-goals

HTTP delivery, the OpenMetrics format (exemplars, _created), summaries and quantiles, push gateways, and multi-threaded access are not part of this library.

## 5. Contract change history

- 0.1.0: initial contract.
