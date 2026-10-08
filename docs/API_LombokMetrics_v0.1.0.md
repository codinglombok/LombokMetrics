# API LombokMetrics v0.1.0

Bahasa referensi: TypeScript. Port Python memakai penamaan snake_case dan mengembalikan tuple atau dataclass dengan isi yang sama. Stabilitas: 0.x, perubahan dapat terjadi dengan catatan di CHANGELOG. Sejak versi: 0.1.0.

- `new Registry(): counter(name, help, labelNames); gauge(name, help, labelNames); histogram(name, buckets, help, labelNames); render()`
- `Counter.inc(labels, v=1); Gauge.set(labels, v); Gauge.inc/dec(labels, v=1); Histogram.observe(labels, v)`
- `formatNumber(x) -> string`

Kesalahan masukan di luar rentang SPEC memicu `RangeError` (TypeScript) atau `ValueError` (Python); fungsi yang didefinisikan total mengembalikan nilai khusus (null, invalid) sesuai SPEC.

Kompatibilitas lintas bahasa: lihat SPEC bagian 3 dan vector.
