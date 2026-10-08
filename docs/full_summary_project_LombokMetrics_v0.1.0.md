# Ringkasan Proyek LombokMetrics

## Apa ini

Zero-dependency metrics registry with Prometheus text exposition: counters, gauges, histograms, labels, canonical number formatting. Part of the Lombok Ecosystem.

## Mengapa dibuat

Semua layanan, perangkat, dan skrip yang perlu mengekspos angka operasional membutuhkan format yang sama dan keluaran yang stabil. Library ini menyimpan metrik di memori dan menghasilkan teks eksposisi dengan urutan dan format angka yang pasti, identik di setiap bahasa, sehingga mudah diuji dan dibandingkan.

## Fitur utama

- Counter, Gauge, Histogram dengan label
- Teks eksposisi Prometheus 0.0.4 (HELP, TYPE, escape label)
- Format angka kanonik (identik lintas bahasa)
- Urutan keluaran deterministik (metrik menurut nama, seri menurut nilai label per code point)
- Validasi nama metrik dan label

## Status saat ini

Versi 0.1.0, belum dirilis. TypeScript dan Python lulus 116 kasus vector. Port lain belum ada.

## Contoh pemakai

- Layanan HTTP atau worker yang menyediakan endpoint /metrics
- Skrip batch atau cron yang menulis berkas metrik untuk dikumpulkan
- Gateway atau perangkat tertanam yang melaporkan penghitung dan suhu
- Pengujian: membandingkan keluaran metrik secara tepat tanpa bergantung urutan hash

## Batasan yang Diketahui

- Hanya format teks 0.0.4; OpenMetrics dan summary BELUM.
- Tidak aman antar-thread; pemanggil menyerialisasi akses.
- Tidak ada pembatas jumlah seri (kardinalitas label ditanggung pemanggil).
- Port Rust, Go, PHP BELUM.

## Info lanjut

SPEC: `SPEC_LombokMetrics_v0.1.0.md`; API: `API_LombokMetrics_v0.1.0.md`; panduan: `guide_how_to_use_LombokMetrics_v0.1.0.md`.

## Gap vs pembanding

Pembanding: prometheus client (Go, Python, Node), metrics-rs. Gap jujur: tidak ada collector proses/runtime, summary, atau OpenMetrics; keunggulan: keluaran identik lintas bahasa dan jejak kecil tanpa dependensi.
