import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { username } from 'better-auth/plugins';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { domainAllowed, getAuthFlags, isConfigInitialized } from '$lib/server/config';
import { sendEmail } from '$lib/server/email';

const DEV_SECRET = 'dev-insecure-secret-jangan-dipakai-di-produksi';

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET ?? (dev ? DEV_SECRET : undefined),
	baseURL: env.BETTER_AUTH_URL ?? (dev ? 'http://localhost:5173' : undefined),
	database: drizzleAdapter(db, { provider: 'pg' }),
	emailAndPassword: {
		enabled: true,
		minPasswordLength: 8,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				subject: 'Reset password',
				text: `Klik tautan berikut untuk mengatur ulang password Anda (berlaku 1 jam):\n${url}`
			});
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			void sendEmail({
				to: user.email,
				subject: 'Verifikasi email Anda',
				text: `Klik tautan berikut untuk memverifikasi email Anda:\n${url}`
			});
		},
		autoSignInAfterVerification: true,
		expiresIn: 3600
	},
	socialProviders: {
		google: {
			clientId: env.GOOGLE_CLIENT_ID ?? '',
			clientSecret: env.GOOGLE_CLIENT_SECRET ?? ''
		}
	},
	user: {
		additionalFields: {
			role: { type: 'string', defaultValue: 'user', input: false }
		}
	},
	plugins: [
		username()
	],
	trustedOrigins: env.BETTER_AUTH_URL ? [env.BETTER_AUTH_URL] : [],
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			const flags = await getAuthFlags();

			if (ctx.path === '/sign-up/email') {
				if (!flags.signupEnabled) {
					if (await isConfigInitialized()) {
						throw new APIError('FORBIDDEN', { message: 'Pendaftaran akun baru sedang ditutup.' });
					}
				}
				return;
			}

			if (ctx.path === '/sign-in/email' || ctx.path === '/sign-in/username') {
				if (flags.loginMethod === 'google') {
					throw new APIError('FORBIDDEN', {
						message: 'Login hanya diizinkan melalui Google untuk app ini.'
					});
				}
				if (flags.verificationMode === 'required') {
					const identifier = String(ctx.body?.email ?? ctx.body?.username ?? '');
					const rows = await db
						.select({ id: userTable.id })
						.from(userTable)
						.where(eq(userTable.email, identifier.toLowerCase()))
						.limit(1);
					if (rows.length === 0) return;
					const verified = await db
						.select({ v: userTable.emailVerified })
						.from(userTable)
						.where(eq(userTable.id, rows[0].id))
						.limit(1);
					if (verified[0] && !verified[0].v) {
						throw new APIError('FORBIDDEN', {
							message: 'Email belum diverifikasi. Periksa inbox Anda.'
						});
					}
				}
				return;
			}

			if (ctx.path === '/sign-in/social' && flags.loginMethod === 'password') {
				throw new APIError('FORBIDDEN', {
					message: 'Login sosial dinonaktifkan untuk app ini.'
				});
			}

			if ((ctx.path === '/forget-password' || ctx.path === '/reset-password') && flags.resetMode === 'admin') {
				throw new APIError('FORBIDDEN', {
					message: 'Reset password dilakukan manual oleh admin.'
				});
			}
		}),
		after: createAuthMiddleware(async (ctx) => {
			if (ctx.path === '/sign-up/email') {
				const returned = ctx.context.returned;
				if (
					returned &&
					typeof returned === 'object' &&
					'user' in returned &&
					returned.user &&
					typeof returned.user === 'object'
				) {
					const u = returned.user as { id: string; email?: string; emailVerified?: boolean };
					const flags = await getAuthFlags();
					if (!u.emailVerified && domainAllowed(u.email ?? '', flags.autoVerifyDomains)) {
						await db
							.update(userTable)
							.set({ emailVerified: true, updatedAt: new Date() })
							.where(eq(userTable.id, u.id));
					}
				}
			}
		})
	}
});

export type Session = typeof auth.$Infer.Session;

type CookieOptions = {
	path: string;
	httpOnly?: boolean;
	secure?: boolean;
	sameSite?: boolean | 'lax' | 'strict' | 'none';
	expires?: Date;
	maxAge?: number;
};

export async function applyAuthCookies(cookies: Cookies, response: Response): Promise<void> {
	for (const raw of response.headers.getSetCookie()) {
		const [pair, ...attrs] = raw.split(';');
		const eq = pair.indexOf('=');
		if (eq === -1) continue;
		const name = pair.slice(0, eq).trim();
		let value = pair.slice(eq + 1).trim();
		try {
			value = decodeURIComponent(value);
		} catch {
			// nilai bukan percent-encoded; biarkan apa adanya
		}
		const opts: CookieOptions = { path: '/' };
		for (const attr of attrs) {
			const [k, v = ''] = attr.trim().split('=');
			const key = k.toLowerCase();
			if (key === 'path') opts.path = v || '/';
			else if (key === 'httponly') opts.httpOnly = true;
			else if (key === 'secure') opts.secure = true;
			else if (key === 'samesite')
				opts.sameSite = (v.toLowerCase() || 'lax') as 'lax' | 'strict' | 'none';
			else if (key === 'expires' && v) opts.expires = new Date(v);
			else if (key === 'max-age' && v) opts.maxAge = Number(v);
		}
		cookies.set(name, value, opts);
	}
}

export async function apiErrorMessage(response: Response): Promise<string> {
	try {
		const data = await response.json();
		if (data && typeof data.message === 'string' && data.message.length > 0) {
			return data.message;
		}
	} catch {
		// body bukan JSON
	}
	return 'Terjadi kesalahan. Coba lagi nanti.';
}
