import { db } from '$lib/server/db';
import { appConfig } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { domainAllowed, normalizeDomain } from '$lib/server/domains';

export { domainAllowed, normalizeDomain };

export type LoginMethod = 'password' | 'google' | 'both';
export type VerificationMode = 'required' | 'optional' | 'auto_domain';
export type ResetMode = 'email' | 'admin';

export interface AuthFlags {
	signupEnabled: boolean;
	loginMethod: LoginMethod;
	usernameLogin: boolean;
	verificationMode: VerificationMode;
	autoVerifyDomains: string[];
	resetMode: ResetMode;
}

const CACHE_TTL_MS = 3000;

let cache: { flags: AuthFlags; at: number } | null = null;

function envList(key: string): string[] {
	return (env[key] ?? '')
		.split(',')
		.map((d) => d.trim().toLowerCase().replace(/^@/, ''))
		.filter(Boolean);
}

export const DEFAULT_FLAGS: AuthFlags = {
	signupEnabled: (env.SIGNUP_ENABLED ?? 'true') !== 'false',
	loginMethod: isLoginMethod(env.LOGIN_METHOD) ? env.LOGIN_METHOD : 'both',
	usernameLogin: (env.USERNAME_LOGIN ?? 'true') !== 'false',
	verificationMode: isVerificationMode(env.EMAIL_VERIFICATION) ? env.EMAIL_VERIFICATION : 'optional',
	autoVerifyDomains: envList('AUTO_VERIFY_DOMAINS'),
	resetMode: env.RESET_MODE === 'admin' ? 'admin' : 'email'
};

function isLoginMethod(v: string | undefined): v is LoginMethod {
	return v === 'password' || v === 'google' || v === 'both';
}
function isVerificationMode(v: string | undefined): v is VerificationMode {
	return v === 'required' || v === 'optional' || v === 'auto_domain';
}

export async function getAuthFlags(): Promise<AuthFlags> {
	if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.flags;
	const rows = await db.select().from(appConfig);
	const map = new Map(rows.map((r) => [r.key, r.value]));
	const flags: AuthFlags = {
		signupEnabled: parseBool(map.get('signup_enabled'), DEFAULT_FLAGS.signupEnabled),
		loginMethod: isLoginMethod(map.get('login_method') ?? undefined)
			? (map.get('login_method') as LoginMethod)
			: DEFAULT_FLAGS.loginMethod,
		usernameLogin: parseBool(map.get('username_login'), DEFAULT_FLAGS.usernameLogin),
		verificationMode: isVerificationMode(map.get('verification_mode') ?? undefined)
			? (map.get('verification_mode') as VerificationMode)
			: DEFAULT_FLAGS.verificationMode,
		autoVerifyDomains:
			map.has('auto_verify_domains')
				? normalizeDomain(map.get('auto_verify_domains') ?? '')
				: DEFAULT_FLAGS.autoVerifyDomains,
		resetMode: map.get('reset_mode') === 'admin' ? 'admin' : map.get('reset_mode') === 'email' ? 'email' : DEFAULT_FLAGS.resetMode
	};
	cache = { flags, at: Date.now() };
	return flags;
}

export async function setAuthFlags(patch: Partial<Record<string, string>>): Promise<void> {
	const entries = Object.entries(patch).filter(
		(entry): entry is [string, string] => typeof entry[1] === 'string'
	);
	for (const [key, value] of entries) {
		await db
			.insert(appConfig)
			.values({ key, value })
			.onConflictDoUpdate({ target: appConfig.key, set: { value, updatedAt: new Date() } });
	}
	cache = null;
}

export async function isConfigInitialized(): Promise<boolean> {
	const rows = await db.select().from(appConfig).limit(1);
	return rows.length > 0;
}

function parseBool(v: string | undefined, fallback: boolean): boolean {
	if (v === 'true') return true;
	if (v === 'false') return false;
	return fallback;
}
