# Repository Structure LombokMetrics

## 1. Folder structure

```
LombokMetrics/
  README.md  CHANGELOG.md  LICENSE-APACHE  LICENSE-MIT  version.txt  .gitignore
  docs/        standard documents (masterplan_ and architecture_ are internal, not committed)
  vectors/     lombokmetrics-vectors-v1.json  cross-language contract
  typescript/  package.json  tsconfig*.json  src/index.ts  test/vectors.test.ts
  python/      pyproject.toml  src/lombokmetrics/__init__.py  tests/test_vectors.py
  scripts/     gen_vectors.ts  generates vectors from the TypeScript reference
  examples/    example.ts  example.py  OUTPUT.txt
```

## 2. Naming conventions

Repository `LombokMetrics`; npm/PyPI package `lombokmetrics`; documents `<type>_LombokMetrics_v<semver>.md`.

## 3. Required root files

README.md, CHANGELOG.md, LICENSE-APACHE, LICENSE-MIT, version.txt, .gitignore (ADR-024).

## 4. Structure per port

TypeScript: a single module `src/index.ts` with no runtime dependencies. Python: a single package `src/lombokmetrics` with no dependencies.

## 5. Notes

The Rust, Go and PHP ports do not exist yet; their folders are created only once a port has a vector runner (GP-11).
