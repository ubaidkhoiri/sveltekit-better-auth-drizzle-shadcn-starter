import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

interface StepResult {
	step: string;
	ok: boolean;
	note?: string;
}

export const POST: RequestHandler = async () => {
	const email = `selftest-${Date.now()}@test.local`;
	const password = 'selftest-pass-123';
	const steps: StepResult[] = [];

	try {
		const signUpRes = await auth.api.signUpEmail({
			body: { name: 'Selftest', email, password },
			asResponse: true
		});
		steps.push({ step: 'Daftar akun uji', ok: signUpRes.ok });
	} catch (error) {
		steps.push({
			step: 'Daftar akun uji',
			ok: false,
			note: error instanceof Error ? error.message : 'Gagal tidak diketahui'
		});
		return json({ steps });
	}

	try {
		const signInRes = await auth.api.signInEmail({ body: { email, password }, asResponse: true });
		const hasSessionCookie = signInRes.headers.getSetCookie().some((c) => c.includes('session'));
		steps.push({ step: 'Masuk dengan akun uji', ok: signInRes.ok });
		steps.push({
			step: 'Cookie sesi diterbitkan',
			ok: signInRes.ok && hasSessionCookie,
			note: hasSessionCookie ? undefined : 'Header Set-Cookie tidak ditemukan.'
		});
	} catch (error) {
		steps.push({
			step: 'Masuk dengan akun uji',
			ok: false,
			note: error instanceof Error ? error.message : 'Gagal tidak diketahui'
		});
	}

	try {
		const rows = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
		await db.delete(user).where(eq(user.email, email));
		steps.push({
			step: 'Hapus akun uji (bersih-bersih)',
			ok: rows.length > 0,
			note: rows.length > 0 ? undefined : 'Akun tidak ditemukan saat pembersihan.'
		});
	} catch (error) {
		steps.push({
			step: 'Hapus akun uji (bersih-bersih)',
			ok: false,
			note: error instanceof Error ? error.message : 'Gagal membersihkan.'
		});
	}

	return json({ steps });
};
