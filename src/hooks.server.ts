import { json, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { limitAuth } from '$lib/server/ratelimit';

if (!dev) {
	if (!(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)) {
		console.warn(
			'[startup] UPSTASH_REDIS_REST_URL/TOKEN tidak diset — rate limiting auth NONAKTIF di produksi.'
		);
	}
	if (!env.GOOGLE_CLIENT_ID) {
		console.warn('[startup] GOOGLE_CLIENT_ID tidak diset — login Google tidak akan berfungsi.');
	}
}

const isAuthRoute = (pathname: string): boolean =>
	pathname.startsWith('/api/auth/') || pathname === '/auth' || pathname.startsWith('/auth/');

const rateLimitAuthRoutes: Handle = async ({ event, resolve }) => {
	if (isAuthRoute(event.url.pathname)) {
		let ip = 'unknown';
		try {
			ip = event.getClientAddress();
		} catch {
			ip = event.request.headers.get('x-forwarded-for') ?? 'unknown';
		}
		const { success } = await limitAuth(ip);
		if (!success) {
			return json({ error: 'Terlalu banyak permintaan. Coba lagi nanti.' }, { status: 429 });
		}
	}
	return resolve(event);
};

const populateSession: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;
	return resolve(event);
};

export const handle = sequence(rateLimitAuthRoutes, populateSession);
