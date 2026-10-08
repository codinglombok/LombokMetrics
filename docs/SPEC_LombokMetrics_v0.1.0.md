# SPEC LombokMetrics v0.1.0

This document is the normative cross-language contract. Every language port MUST produce byte-identical output for all specified inputs. Deviations from this specification are bugs.

Kata MUST, SHOULD, dan MAY dibaca sesuai RFC 2119. Tinjauan terakhir: 2026-10-07.

## 0. Standar acuan

Library ini mendefinisikan kontraknya sendiri; tidak ada standar eksternal normatif kecuali yang disebut pada bagian terkait.

## 1. Vector

| Berkas | Kasus | SHA-256 |
|---|---|---|
| `vectors/lombokmetrics-vectors-v1.json` | 116 | `f416bb60ba2297601acef68806fa1de104872d9e522f0d64c0c8b5e3eee1928b` |

## 2. Kontrak

1. Nama metrik cocok ^[a-zA-Z_:][a-zA-Z0-9_:]*$ dan unik; nama label cocok ^[a-zA-Z_][a-zA-Z0-9_]*$, tidak diawali '__', unik, dan 'le' dilarang pada histogram.
2. Counter hanya menerima kenaikan terhingga >= 0; Gauge tidak menerima NaN; inc/dec Gauge harus terhingga; Histogram menerima nilai terhingga. Batas bucket terhingga dan naik tegas; bucket +Inf implisit.
3. Label pada operasi harus tepat sama dengan nama label yang dideklarasikan, bernilai string. Metrik tanpa label memiliki seri bernilai 0 sejak dibuat; metrik berlabel memunculkan seri pada pemakaian pertama.
4. render: metrik diurutkan menurut nama (urutan code point); tiap metrik menulis `# HELP` (dilewati bila help kosong; escape \ dan LF) lalu `# TYPE`, lalu seri diurutkan menurut daftar nilai label per code point. Label ditulis menurut urutan deklarasi dengan escape \, " dan LF pada nilai. Setiap baris diakhiri LF; registri kosong menghasilkan string kosong.
5. Histogram: untuk tiap seri tulis `_bucket{...,le="b"}` kumulatif untuk tiap batas, `le="+Inf"`, lalu `_sum` dan `_count`. Nilai v masuk bucket pertama dengan batas >= v.
6. formatNumber: NaN, +Inf, -Inf; nol (termasuk -0) menjadi 0; selain itu digit terpendek yang dapat dibaca balik persis, notasi desimal bila 1e-5 <= |x| < 1e15, selain itu d.ddde+XX dengan eksponen minimal dua digit.

## 3. Representasi lintas bahasa

Indeks dan panjang string dihitung per code point; angka floating point memakai IEEE 754 double dengan urutan operasi seperti tertulis; bilangan bulat besar tidak boleh kehilangan presisi.

## 4. Non-goals

Pengiriman HTTP, format OpenMetrics (exemplar, _created), summary/kuantil, push gateway, dan pemrosesan multi-thread bukan bagian library ini.

## 5. Riwayat perubahan kontrak

- 0.1.0: kontrak awal.
