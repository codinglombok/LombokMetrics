# Panduan Pemakaian LombokMetrics

## 1. Instalasi

Setelah rilis: `npm install lombokmetrics` atau `pip install lombokmetrics`. Sebelum rilis, salin folder `typescript/src` atau `python/src/lombokmetrics` (tanpa dependensi).

## 2. Konsep dasar

Registry menyimpan metrik. counter, gauge, dan histogram dideklarasikan dengan nama dan label; operasi memakai objek label yang tepat sama dengan deklarasi. render() menghasilkan teks Prometheus yang dapat disajikan di endpoint /metrics atau ditulis ke berkas.

## 3. Contoh

Berkas `examples/example.ts` dan `examples/example.py` menghasilkan keluaran berikut (TypeScript; Python sama kecuali format cetak):

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

Kode TypeScript:

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

- Endpoint /metrics: sajikan reg.render() dengan tipe konten text/plain; version=0.0.4.
- Berkas untuk kolektor: tulis render() ke berkas sementara lalu ganti nama secara atomik.
- Pengujian: bandingkan render() dengan teks yang diharapkan; urutannya tetap.

## 5. Common pitfalls

- Hanya format teks 0.0.4; OpenMetrics dan summary BELUM.
- Tidak aman antar-thread; pemanggil menyerialisasi akses.
- Tidak ada pembatas jumlah seri (kardinalitas label ditanggung pemanggil).
- Port Rust, Go, PHP BELUM.

## 6. Lihat juga

`SPEC_LombokMetrics_v0.1.0.md`, `API_LombokMetrics_v0.1.0.md`, `full_summary_project_LombokMetrics_v0.1.0.md`.
