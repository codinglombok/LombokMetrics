# LombokMetrics

Zero-dependency metrics registry with Prometheus text exposition: counters, gauges, histograms, labels, canonical number formatting. Part of the Lombok Ecosystem.

## Mengapa library ini?

Semua layanan, perangkat, dan skrip yang perlu mengekspos angka operasional membutuhkan format yang sama dan keluaran yang stabil. Library ini menyimpan metrik di memori dan menghasilkan teks eksposisi dengan urutan dan format angka yang pasti, identik di setiap bahasa, sehingga mudah diuji dan dibandingkan.

## Fitur

- Counter, Gauge, Histogram dengan label
- Teks eksposisi Prometheus 0.0.4 (HELP, TYPE, escape label)
- Format angka kanonik (identik lintas bahasa)
- Urutan keluaran deterministik (metrik menurut nama, seri menurut nilai label per code point)
- Validasi nama metrik dan label

## Skenario pemakaian

- Layanan HTTP atau worker yang menyediakan endpoint /metrics
- Skrip batch atau cron yang menulis berkas metrik untuk dikumpulkan
- Gateway atau perangkat tertanam yang melaporkan penghitung dan suhu
- Pengujian: membandingkan keluaran metrik secara tepat tanpa bergantung urutan hash

## Instalasi

Belum terbit di registry (0.1.0 belum dirilis). Setelah rilis:

```
npm install lombokmetrics
pip install lombokmetrics
```

## API ringkas

- `new Registry(): counter(name, help, labelNames); gauge(name, help, labelNames); histogram(name, buckets, help, labelNames); render()`
- `Counter.inc(labels, v=1); Gauge.set(labels, v); Gauge.inc/dec(labels, v=1); Histogram.observe(labels, v)`
- `formatNumber(x) -> string`

Rincian: `docs/API_LombokMetrics_v0.1.0.md`.

## Status port

| Port | Status |
|---|---|
| TypeScript (referensi) | YA, lulus seluruh 116 kasus vector |
| Python | YA, lulus seluruh 116 kasus vector |
| Rust, Go, PHP | BELUM |

## Standar yang diimplementasikan

Kontrak normatif ada di `docs/SPEC_LombokMetrics_v0.1.0.md`; vector di `vectors/lombokmetrics-vectors-v1.json`.

## Batasan yang diketahui

- Hanya format teks 0.0.4; OpenMetrics dan summary BELUM.
- Tidak aman antar-thread; pemanggil menyerialisasi akses.
- Tidak ada pembatas jumlah seri (kardinalitas label ditanggung pemanggil).
- Port Rust, Go, PHP BELUM.

## Pengembangan

```
node --test typescript/test/          # TypeScript (Node 22+)
python -m pytest python/tests         # Python 3.10+
node scripts/gen_vectors.ts           # membangkitkan ulang vector dari referensi TypeScript
```

## Ekosistem Lombok

Part of the [Lombok Ecosystem](https://github.com/codinglombok).

## Lisensi

Apache-2.0 OR MIT (lihat `LICENSE-APACHE` dan `LICENSE-MIT`).
