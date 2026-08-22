import { sql } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';

export type CheckStatus = 'ok' | 'warn' | 'fail';

export interface Check {
	id: string;
	label: string;
	status: CheckStatus;
	detail: string;
	fix?: string;
}

export async function runDiagnostics(origin: string): Promise<Check[]> {
	const checks: Check[] = [];

	try {
		await db.execute(sql`select 1`);
		checks.push({
			id: 'db',
			label: 'Koneksi database',
			status: 'ok',
			detail: 'NeonDB dapat dijangkau.'
		});
	} catch {
		checks.push({
			id: 'db',
			label: 'Koneksi database',
			status: 'fail',
			detail: 'DATABASE_URL tidak dapat dihubungi.',
			fix: 'Isi DATABASE_URL di file .env dengan connection string dari NeonDB, lalu restart server.'
		});
		return checks;
	}

	try {
		const result = await db.execute<{ count: number }>(
			sql`select count(*)::int as count from information_schema.tables where table_schema = 'public' and table_name in ('user', 'session', 'account', 'verification')`
		);
		const rows =
			(result as unknown as { rows?: { count: number }[] }).rows ??
			(result as unknown as { count: number }[]);
		const first = Array.isArray(rows) ? rows[0] : undefined;
		const count = Number(first?.count ?? 0);
		checks.push(
			count === 4
				? {
						id: 'tables',
						label: 'Tabel autentikasi',
						status: 'ok',
						detail: 'Semua tabel (user, session, account, verification) tersedia.'
					}
				: {
						id: 'tables',
						label: 'Tabel autentikasi',
						status: 'fail',
						detail: `Hanya ${count} dari 4 tabel ditemukan.`,
						fix: 'Jalankan `npm run db:push` untuk membuat tabel, lalu restart server.'
					}
		);
	} catch {
		checks.push({
			id: 'tables',
			label: 'Tabel autentikasi',
			status: 'fail',
			detail: 'Gagal memeriksa tabel.',
			fix: 'Jalankan `npm run db:push`.'
		});
	}

	const secret = env.BETTER_AUTH_SECRET ?? '';
	if (!secret) {
		checks.push({
			id: 'secret',
			label: 'BETTER_AUTH_SECRET',
			status: 'fail',
			detail: 'Secret belum diset — sesi tidak dapat ditandatangani.',
			fix: 'Isi BETTER_AUTH_SECRET di .env dengan string acak minimal 32 karakter.'
		});
	} else if (secret.startsWith('dev-insecure')) {
		checks.push({
			id: 'secret',
			label: 'BETTER_AUTH_SECRET',
			status: 'warn',
			detail: 'Masih memakai secret default mode dev.',
			fix: 'Ganti dengan string acak sendiri (mis. hasil `openssl rand -hex 32`).'
		});
	} else if (secret.length < 32) {
		checks.push({
			id: 'secret',
			label: 'BETTER_AUTH_SECRET',
			status: 'warn',
			detail: 'Secret kurang dari 32 karakter.',
			fix: 'Perpanjang secret minimal 32 karakter.'
		});
	} else {
		checks.push({
			id: 'secret',
			label: 'BETTER_AUTH_SECRET',
			status: 'ok',
			detail: 'Secret terpasang dan panjangnya memadai.'
		});
	}

	const baseURL = env.BETTER_AUTH_URL ?? '';
	if (!baseURL) {
		checks.push({
			id: 'base-url',
			label: 'BETTER_AUTH_URL',
			status: 'warn',
			detail: 'Belum diset. Beberapa fitur (tautan verifikasi/reset, OAuth callback) bisa salah arah.',
			fix: `Isi BETTER_AUTH_URL=${origin} di .env untuk lingkungan ini.`
		});
	} else if (baseURL.replace(/\/$/, '') !== origin.replace(/\/$/, '')) {
		checks.push({
			id: 'base-url',
			label: 'BETTER_AUTH_URL',
			status: 'warn',
			detail: `Nilai (${baseURL}) berbeda dari origin saat ini (${origin}).`,
			fix: 'Sesuaikan bila ini bukan yang dimaksud (normal bila akses via IP/Tailscale).'
		});
	} else {
		checks.push({
			id: 'base-url',
			label: 'BETTER_AUTH_URL',
			status: 'ok',
			detail: 'Cocok dengan origin saat ini.'
		});
	}

	const googleId = env.GOOGLE_CLIENT_ID ?? '';
	const googleSecret = env.GOOGLE_CLIENT_SECRET ?? '';
	if (googleId && googleSecret) {
		checks.push({
			id: 'google',
			label: 'Login Google',
			status: 'ok',
			detail: 'Client ID dan Secret terpasang.'
		});
	} else {
		checks.push({
			id: 'google',
			label: 'Login Google',
			status: 'warn',
			detail: 'Belum dikonfigurasi — tombol Google tidak akan berfungsi.',
			fix: 'Ikuti panduan "Setup Google OAuth" di README.md, isi GOOGLE_CLIENT_ID/SECRET di .env.'
		});
	}

	const upstashUrl = env.UPSTASH_REDIS_REST_URL ?? '';
	const upstashToken = env.UPSTASH_REDIS_REST_TOKEN ?? '';
	if (upstashUrl && upstashToken) {
		checks.push({
			id: 'ratelimit',
			label: 'Rate limiting (Upstash)',
			status: 'ok',
			detail: 'Rate limit auth aktif (20 permintaan/menit per IP).'
		});
	} else {
		checks.push({
			id: 'ratelimit',
			label: 'Rate limiting (Upstash)',
			status: 'warn',
			detail: 'Belum aktif — endpoint auth tanpa pembatasan (tidak aman untuk produksi).',
			fix: 'Daftar gratis di upstash.com (REST Redis), isi UPSTASH_REDIS_REST_URL/TOKEN di .env.'
		});
	}

	try {
		const res = await fetch(`${origin}/manifest.webmanifest`);
		checks.push(
			res.ok
				? {
						id: 'pwa',
						label: 'PWA manifest',
						status: 'ok',
						detail: 'Manifest terlayani — app bisa dipasang sebagai PWA.'
					}
				: {
						id: 'pwa',
						label: 'PWA manifest',
						status: 'fail',
						detail: `Manifest merespons ${res.status}.`
					}
		);
	} catch {
		checks.push({
			id: 'pwa',
			label: 'PWA manifest',
			status: 'fail',
			detail: 'Gagal mengambil manifest.'
		});
	}

	checks.push({
		id: 'email',
		label: 'Pengirim email',
		status: 'warn',
		detail:
			'Masih memakai stub: tautan verifikasi/reset dicetak ke console terminal, tidak benar-benar dikirim.',
		fix: 'Sebelum produksi, ganti implementasi sendEmail() di src/lib/server/email.ts dengan provider (Resend/SMTP).'
	});

	return checks;
}
