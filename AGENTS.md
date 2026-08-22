# AGENTS.md — Konteks Project & Aturan untuk AI Agent

## Ringkasan

SvelteKit PWA starter untuk app internal: auth lengkap + kebijakan login yang bisa diatur runtime via UI. Bahasa UI: **Indonesia**. Node 20+, Windows dev environment (PowerShell).

## Stack

| Lapisan | Teknologi |
| --- | --- |
| Framework | SvelteKit 2 + Svelte 5 (runes) + Vite 8 rolldown |
| Auth | Better Auth 1.7 (`better-auth/svelte` client) |
| DB | Drizzle ORM + NeonDB (`@neondatabase/serverless` neon-http) |
| UI | shadcn-svelte + Tailwind CSS v4 |
| Form | Superforms v2 + Zod v4 |
| Rate limit | @upstash/ratelimit (opsional; fail-open tanpa env Upstash) |
| PWA | @vite-pwa/sveltekit (Cache First, toast update) |

## Perintah

```sh
npm run dev          # dev server
npm run check        # svelte-check (harus 0 error)
npm test             # vitest unit test
npm run build        # build produksi + cek budget bundle <100KB gzip
npm run db:generate  # generate migration Drizzle dari schema
npm run db:push      # push schema langsung ke NeonDB
npx playwright test  # e2e
```

Verifikasi minimum setelah mengubah kode: `npm run check` + `npm test`.

## Env

Wajib: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Opsional: `UPSTASH_REDIS_REST_URL/TOKEN`, fallback flag (`SIGNUP_ENABLED`, `LOGIN_METHOD`, `USERNAME_LOGIN`, `EMAIL_VERIFICATION`, `AUTO_VERIFY_DOMAINS`, `RESET_MODE`). Lihat `.env.example`.

## Struktur kunci

- `src/lib/server/auth.ts` — instance Better Auth. **Pola penting**: semua kebijakan dinamis dievaluasi di `hooks.before`/`hooks.after` per-endpoint (`/sign-up/email`, `/sign-in/email`, `/sign-in/username`, `/sign-in/social`, `/forget-password`), bukan config statis — jadi toggle berlaku instan tanpa restart.
- `src/lib/server/config.ts` — sumber kebenaran flag: tabel `app_config` → cache 3 detik → fallback env. Fungsi: `getAuthFlags()`, `setAuthFlags()`, `isConfigInitialized()`.
- `src/lib/server/db/schema.ts` — Drizzle schema. Tabel user punya kolom ekstra: `username`, `display_username`, `role` (`'owner'|'admin'|'user'`). Role wajib dideklarasikan di `user.additionalFields` agar muncul di tipe session.
- `src/routes/+layout.server.ts` — paksa redirect semua halaman ke `/setup/wizard` selama `app_config` kosong (kecuali `/setup*`, `/auth*`, `/api*`). Jangan hapus guard ini.
- `src/routes/setup/wizard/` — first-run: buat akun owner (role='owner', emailVerified=true, lolos dari blokir signup karena `isConfigInitialized()` masih false), tulis semua flag.
- `src/routes/dashboard/settings/` — ubah flag runtime; hanya role owner/admin.
- `src/lib/server/domains.ts` — helper pure domain whitelist (+ unit test).
- `src/lib/server/email.ts` — **stub** (console.log). Ganti dengan Resend/SES sebelum butuh email verifikasi/reset sungguhan.
- `drizzle.config.ts` — baca `DATABASE_URL` dari `.env`.

## Konvensi kode

- Validasi input: skema Zod di `src/lib/schemas.ts`, dipakai bersama oleh Superforms (client+server).
- Server-only code di `src/lib/server/*` (dijamin tidak bocor ke client oleh SvelteKit).
- UI komponen shadcn-svelte di `src/lib/components/ui/` — regenerate via CLI shadcn-svelte, jangan edit manual lebih dari perlu.
- Svelte 5 runes (`$state`, `$derived`) — jangan campur sintaks stores lama.
- Bahasa komentar & copy UI: Indonesia.

## Aturan wajib saat menambah/mengubah kode

Agar UI dan fungsi tetap aman untuk semua pengguna target.

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
