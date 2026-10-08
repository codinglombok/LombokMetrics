# Pengembangan LombokMetrics

## 1. Roadmap

- 0.1.1: CI, coverage, fuzz, publish
- 0.2.0: port Rust (no_std+alloc), Go, PHP
- 0.3.0: OpenMetrics (exemplar, _created), summary, pembatas kardinalitas

## 2. Deferred scope

Pengiriman HTTP, format OpenMetrics (exemplar, _created), summary/kuantil, push gateway, dan pemrosesan multi-thread bukan bagian library ini.

## 3. Prinsip desain untuk kontributor

- Kontrak dulu: ubah SPEC dan vector sebelum kode; perbedaan antar-port adalah bug.
- Tanpa dependensi runtime; tanpa jam, tanpa jaringan, tanpa acak tersembunyi.
- Setiap fitur README memiliki kasus vector atau test.
- Tidak ada nama klien atau aplikasi pemilik di berkas publik.
- Tanpa emoji di `*.md`.

## 4. Cara berkontribusi

Fork, cabang `feat/...`, jalankan kedua runner vector, perbarui `API_` dan `SPEC_` bila perilaku berubah, buka PR. Bangkitkan ulang vector dengan `node scripts/gen_vectors.ts` hanya bila kontrak berubah, dan tinjau diff vector.

## 5. Pertanyaan terbuka

- Apakah format OpenMetrics perlu menjadi keluaran kedua atau pengganti?
- Perlu pengumpul statistik runtime opsional per bahasa?
