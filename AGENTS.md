# AGENTS.md — Aturan untuk AI Agent & Developer

Aturan wajib saat menambah/mengubah kode di boilerplate ini, agar UI dan fungsi tetap aman untuk semua pengguna target.

## Target browser (floor)

| Browser | Versi minimum |
| --- | --- |
| iOS (Safari) | **16.0** |
| Chrome / Edge | 107 |
| Firefox | 104 |

Diterapkan lewat `build.target` eksplisit di `vite.config.ts`. Catatan penting: Vite hanya melakukan **transformasi sintaks**, **bukan polyfill API runtime**. Artinya fitur JS/CSS yang lebih baru dari floor tetap akan rusak walau build sukses — karena itu aturan di bawah ada.

Latar belakang: `@vitejs/plugin-legacy` sengaja tidak digunakan. Format output SystemJS telah dihapus di rolldown-vite (Vite 8), sehingga legacy chunks tidak bisa dibuat; dan dengan floor iOS 16 semua browser target sudah mendukung ES modules + dynamic import secara native.

## Aturan CSS

**R1 — Cek sebelum pakai.** Untuk setiap properti/selektor/unit CSS atau utility Tailwind yang belum pernah dipakai di project: cek [caniuse](https://caniuse.com/) dengan filter Safari ≤ 16 dan Chrome ≥ 107. Jika Safari < 16 → **dilarang** pakai tanpa fallback yang fungsional.

**R2 — Zona abu-abu iOS 16.0–16.3 (Tailwind v4).** Tailwind v4 resmi mensupport Safari 16.4+. Fitur yang bergantung pada `@property` (Safari 16.4+) dapat terdegradasi di 16.0–16.3:
- Interpolasi warna gradien via custom properties (`bg-linear-*` + `from-*`/`to-*`, terutama mode oklch/oklab)
- Utility transform 3D/perspective dan beberapa rantai filter berbasis variabel `--tw-*` **saat dianimasikan/di-transisi**
- Aturan praktis: gradien = warna statis + arah tetap (aman). Animasi/transisi gradien & custom-property = hindari.

**R3 — Dilarang tanpa fallback eksplisit** (di atas floor):
- Scroll-driven animations (Chrome 115+)
- View Transitions API (Safari 18+)
- CSS nesting tanpa build step (Tailwind v4 sudah handle — jangan tulis manual)
- `text-wrap: balance/pretty` sebagai satu-satunya mekanisme layout

**R4 — Aman dipakai** (terverifikasi ≥ floor): `:has()` (15.4+), container queries (16+), cascade layers (15+), `aspect-ratio`, warna `oklch()` statis, subgrid (16), unit `dvh/svh/lvh` (15.4+), `overscroll-behavior`.

**R5 — Verifikasi perangkat.** Komponen/halaman baru belum selesai sebelum dicek di perangkat iOS 16.x sungguhan (atau BrowserStack bila tak tersedia). Fokus cek: layout tidak shift, teks terbaca, tombol bisa ditap.

## Aturan JavaScript / Web API

**R6 — Feature-detect API baru.** API yang lebih muda dari floor wajib dicek dulu + fallback anggun:
```ts
if ('PushManager' in window) { /* push flow */ }
```
Watchlist (lebih baru dari floor): `PushManager` di iOS (**16.4+** — push PWA), Badging API (tidak ada di iOS), View Transitions, Navigation API, WebTransport, WebGPU, WebCodecs.

**R7 — Hemat polyfill.** Budget first load < 100 KB gzip. Jangan tambah polyfill global "untuk jaga-jaga"; kalau sebuah API perlu polyfill agar berjalan di floor, pertimbangkan ulang apakah API-nya layak dipakai.

## Proses perubahan design/UI

1. Pilih utility/fitur dari daftar R4 dulu; kebutuhan di luar itu → jalankan R1 dulu, catat hasilnya di PR/deskripsi.
2. Efek visual baru yang menyentuh R2/R3 → sertakan screenshot dari perangkat iOS 16.x sebagai bukti verifikasi.
3. Regression check minimum tiap perubahan UI besar: halaman utama, `/auth/sign-in`, `/dashboard` di iOS 16.x.
