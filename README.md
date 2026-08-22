# SvelteKit PWA Starter

Boilerplate PWA mobile-first: **SvelteKit + Better Auth + Drizzle (NeonDB) + shadcn-svelte + Tailwind v4 + Superforms/Zod + @vite-pwa/sveltekit**.

## Fitur

- **Auth**: [Better Auth](https://www.better-auth.com/) — email/password + username + Google OAuth, sesi di `locals` via hooks; verifikasi email & reset password sudah ter-wire dengan *stub* pengirim email
- **Setup wizard**: saat pertama dibuka, seluruh app dialihkan ke `/setup/wizard` untuk membuat akun owner + menentukan kebijakan login (lihat bagian [Setup Wizard](#setup-wizard-first-run))
- **Kebijakan login dinamis**: toggle sign-up, metode login (password/Google), verifikasi email, domain auto-verifikasi, dan mode reset password — diatur dari UI, berlaku instan tanpa restart
- **Database**: [Drizzle ORM](https://orm.drizzle.team/) + NeonDB (serverless driver HTTP)
- **UI**: [shadcn-svelte](https://shadcn-svelte.com/) + Tailwind CSS v4 (mobile-first)
- **Form**: Superforms v2 + Zod v4 (`zod4` adapter), validasi server-side semua endpoint API + sanitasi input
- **Rate limiting**: [@upstash/ratelimit](https://upstash.com) sliding-window 20 req/menit untuk semua route auth (fail-open jika env Upstash tidak diset)
- **Testing**: Vitest unit test (`npm test`) + Playwright e2e smoke (`npm run test:e2e`)
- **CI & budget**: GitHub Actions (check/test/build/e2e) + guard ukuran first-load JS `<100 KB` gzip (`npm run check:size`)
- **PWA**: [@vite-pwa/sveltekit](https://vite-pwa-org.netlify.app/frameworks/sveltekit) — generateSW + strategi **Cache First**, toast "versi baru tersedia" saat ada update SW
- **Target browser**: iOS 16+ / Safari 16+ / Chrome 107+ / Firefox 104+ (Baseline Widely Available) — `build.target` eksplisit di `vite.config.ts`; `@vitejs/plugin-legacy` tidak digunakan karena floor ini sudah native ESM dan rolldown-vite menghapus format SystemJS. Aturan pemakaian fitur CSS/JS di sekitar floor: lihat [AGENTS.md](./AGENTS.md)

## Persyaratan

- Node.js ≥ 22
- Akun [NeonDB](https://neon.tech)
- Google OAuth Client ID/Secret ([setup](https://www.better-auth.com/docs/authentication/google))
- (Opsional) Akun Upstash Redis untuk rate limiting produksi

## Mulai cepat

```sh
npm install

# konfigurasi environment
cp .env.example .env
# lalu isi DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_CLIENT_ID/SECRET

# buat tabel di database
npm run db:push

# jalankan dev server
npm run dev
```

## Skrip

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm run preview` | Build & preview produksi |
| `npm run check` | Type-check (`svelte-check`) |
| `npm test` | Unit test (Vitest) |
| `npm run db:push` | Push schema Drizzle langsung ke DB (dev) |
| `npm run db:generate` | Generate migrasi SQL ke folder `drizzle/` |
| `npm run db:migrate` | Terapkan migrasi SQL (produksi/CI) |
| `npm run check:size` | Audit first-load JS vs budget 100 KB gzip |
| `npm run test:e2e` | E2E smoke test (Playwright) |
| `npm run db:studio` | Buka Drizzle Studio |

## Environment variables

Lihat `.env.example`. Wajib: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Opsional: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, serta fallback kebijakan login (`SIGNUP_ENABLED`, `LOGIN_METHOD`, `USERNAME_LOGIN`, `EMAIL_VERIFICATION`, `AUTO_VERIFY_DOMAINS`, `RESET_MODE` — lihat [Setup Wizard](#setup-wizard-first-run)).

## Struktur penting

```
src/
├── hooks.server.ts              # rate limit route auth + populate locals.user/session + warning env prod
├── lib/
│   ├── schemas.ts               # skema Zod (sign-up/sign-in/forgot/reset/example)
│   ├── auth-client.ts           # client Better Auth (svelte)
│   ├── components/UpdateToast.svelte  # toast update service worker
│   └── server/
│       ├── auth.ts              # instance Better Auth (drizzle adapter, username plugin, hooks kebijakan login, Google, email flows)
│       ├── config.ts            # feature flags kebijakan login (DB app_config + fallback env, cache 3s)
│       ├── domains.ts           # helper domain whitelist/auto-verify + unit test
│       ├── email.ts             # TITIK KAWAT pengirim email (stub console di dev)
│       ├── ratelimit.ts         # Upstash sliding window (fail-open tanpa env)
│       ├── validation.ts        # validateJson() + sanitizeText()/sanitizeEmail()
│       ├── validation.test.ts   # unit test helper di atas
│       └── db/{index,schema}.ts # drizzle neon-http + tabel user/session/account/verification
└── routes/
    ├── +error.svelte                # halaman error global
    ├── api/auth/[...all]/+server.ts # handler Better Auth
    ├── api/example/+server.ts       # contoh endpoint tervalidasi
    ├── auth/sign-{in,up}/           # halaman form (Superforms + shadcn)
    ├── auth/forgot-password/        # minta tautan reset
    ├── auth/reset-password/         # form password baru (?token=)
    ├── setup/wizard/                # wizard first-run (akun owner + kebijakan login)
    ├── dashboard/settings/          # ubah toggle kebijakan login (owner/admin)
    └── dashboard/                   # halaman terproteksi
e2e/auth.spec.ts                   # smoke test Playwright
scripts/check-bundle-size.mjs      # audit budget bundle
.github/workflows/ci.yml           # CI: check + unit test + build + e2e
```

## Setup Wizard (first run)

Setelah `db:push` dan server berjalan, buka app di browser — **semua halaman otomatis dialihkan ke `/setup/wizard`** selama konfigurasi belum ada. Wizard hanya muncul sekali dan berisi:

1. **Akun owner** — user pertama otomatis ber-role `owner` (bisa akses halaman pengaturan) dan langsung terverifikasi.
2. **Kebijakan login**:
   - *Metode login*: password saja / Google saja / keduanya
   - *Sign-up mandiri*: on/off — off = akun hanya dibuat admin (mode internal/invite-only)
   - *Login username*: on/off — login bisa pakai email atau username
   - *Verifikasi email*: tidak wajib / wajib klik tautan email / otomatis untuk domain tertentu (mis. `perusahaan.com`)
   - *Reset password*: self-service via email / manual oleh admin

Setelah wizard selesai, semua toggle bisa diubah kapan saja dari **Dashboard → Pengaturan login** (`/dashboard/settings`, khusus role `owner`/`admin`) dan **berlaku instan tanpa restart**.

Fallback via env (dipakai sebelum wizard jalan): `SIGNUP_ENABLED`, `LOGIN_METHOD` (`password|google|both`), `USERNAME_LOGIN`, `EMAIL_VERIFICATION` (`required|optional|auto_domain`), `AUTO_VERIFY_DOMAINS` (pisah koma), `RESET_MODE` (`email|admin`). Nilai yang tersimpan di tabel `app_config` selalu menang atas env.

> Untuk deploy produksi: set env wajib dulu, jalankan migrasi, lalu buka URL app — Anda akan langsung dibawa ke wizard untuk membuat akun owner pertama.

## Email (verifikasi & reset password)

Alur sudah ter-wire penuh; yang belum terpasang hanyalah **pengirim email sungguhan**.

- **Dev**: `src/lib/server/email.ts` mencetak isi email (termasuk tautan verifikasi/reset) ke console terminal — salin tautannya untuk testing alur.
- **Produksi**: ganti implementasi `sendEmail()` di `email.ts` dengan provider (Resend, SMTP, dsb). Tanpa diganti, email tidak terkirim dan muncul `console.warn` per attempt.
- Halaman tersedia: `/auth/forgot-password` (pesan generik, anti user-enumeration) dan `/auth/reset-password?token=...`.
- Opsional memperketat: set `emailAndPassword.requireEmailVerification: true` di `auth.ts` agar login diblokir sampai email terverifikasi, dan/atau `emailVerification.sendOnSignUp: true` agar email verifikasi dikirim saat daftar ([docs](https://www.better-auth.com/docs/concepts/email-password)).

## Setup Google OAuth (langkah demi langkah)

1. Buka [console.cloud.google.com](https://console.cloud.google.com/apis/credentials) → **Create credentials → OAuth client ID** → tipe **Web application**.
2. **Authorized JavaScript origins**: `http://localhost:5173` dan domain produksi Anda.
3. **Authorized redirect URIs**: `http://localhost:5173/api/auth/callback/google` dan `https://DOMAIN-PRODUKSI/api/auth/callback/google`.
4. Salin Client ID & Secret ke `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`), restart dev server.
5. Di layar consent Google, tambahkan akun test Anda bila app masih mode *Testing*.

## Testing E2E (Playwright)

```sh
npx playwright install chromium   # sekali saja
npm run build
npm run test:e2e                  # butuh DATABASE_URL valid (db:push dulu)
```

Tanpa build lokal: jalankan server sendiri lalu set `E2E_BASE_URL=http://localhost:3000 npm run test:e2e`. Di CI job `e2e` otomatis menyediakan Postgres 16 + menjalankan `db:push`.

## CI

`.github/workflows/ci.yml` menjalankan dua job pada setiap push/PR:

- **check-test-build**: `npm ci` → `check` → unit test → `build` → `check:size`.
- **e2e**: Postgres service container + `db:push` + build + Playwright chromium.

## Sebelum produksi

- **Ganti stub email** — lihat bagian *Email* di atas; tanpa itu reset password/verifikasi tidak mengirim apa pun.
- Set `BETTER_AUTH_SECRET` acak (≥32 karakter) dan `BETTER_AUTH_URL` = domain produksi.
- Isi `UPSTASH_REDIS_REST_URL/TOKEN` agar rate limiting benar-benar aktif (*fail-open* tanpa env tersebut; server akan mencetak warning `[startup]` saat env kosong di produksi).
- **Migrasi database**: selama dev `db:push` praktis, tapi untuk produksi gunakan alur berjejak: `db:generate` (commit file SQL di `drizzle/`) lalu `db:migrate` saat deploy.

## Deploy ke Vercel

Adapter sudah disetel ke `@sveltejs/adapter-vercel` (runtime `nodejs22.x`). Set variabel environment di dashboard Vercel, lalu deploy.

## Catatan Windows (build lokal)

`npm run build` di Windows butuh izin **symlink** untuk tahap adapter (`EPERM: operation not permitted, symlink`). Solusi: aktifkan **Developer Mode** (Settings → System → For developers) atau jalankan terminal sebagai Administrator. Deploy ke Vercel tidak terpengaruh.

> **Catatan**: Better Auth masih aktif berkembang — pantau rilis terbaru setiap ±2 minggu (`npm outdated better-auth`).
