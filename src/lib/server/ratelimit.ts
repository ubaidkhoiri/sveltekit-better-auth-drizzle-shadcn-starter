import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

function createLimiter(): Ratelimit | null {
	const url = env.UPSTASH_REDIS_REST_URL;
	const token = env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		console.warn('[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN tidak diset — rate limiting dinonaktifkan.');
		return null;
	}
	return new Ratelimit({
		redis: new Redis({ url, token }),
		limiter: Ratelimit.slidingWindow(20, '1 m'),
		prefix: 'ratelimit:auth'
	});
}

let limiter: Ratelimit | null | undefined;

export async function limitAuth(identifier: string): Promise<{ success: boolean }> {
	limiter ??= createLimiter();
	if (!limiter) return { success: true };
	return limiter.limit(identifier);
}
