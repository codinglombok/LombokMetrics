# Development LombokMetrics

## 1. Roadmap

- 0.1.1: CI, coverage, fuzz, publish
- 0.2.0: Rust (no_std+alloc), Go, PHP ports
- 0.3.0: OpenMetrics (exemplars, _created), summaries, cardinality limiter

## 2. Deferred scope

HTTP delivery, the OpenMetrics format (exemplars, _created), summaries and quantiles, push gateways, and multi-threaded access are not part of this library.

## 3. Design principles for contributors

- Contract first: change the SPEC and vectors before the code; differences between ports are bugs.
- No runtime dependencies; no clock, no network, no hidden randomness.
- Every README feature has a vector case or a test.
- No client or owning-application names in public files.
- No emoji in `*.md`.
- Documentation, comments, error messages and examples are written in English (the default language of all Lombok Ecosystem repositories).

## 4. How to contribute

Fork, create a `feat/...` branch, run both vector runners, update `API_` and `SPEC_` if behavior changes, and open a PR. Regenerate vectors with `node scripts/gen_vectors.ts` only when the contract changes, and review the vector diff.

## 5. Open questions

- Should OpenMetrics be a second output format or a replacement?
- Is an optional per-language runtime statistics collector needed?
