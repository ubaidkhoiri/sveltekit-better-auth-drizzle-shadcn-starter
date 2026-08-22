import { redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import { apiErrorMessage, applyAuthCookies, auth } from '$lib/server/auth';
import {
	getAuthFlags,
	isConfigInitialized,
	setAuthFlags,
	normalizeDomain
} from '$lib/server/config';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sanitizeEmail, sanitizeText } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

const wizardSchema = z.object({
	name: z.string().min(2, 'Nama minimal 2 karakter').max(64),
	email: z.email('Format email tidak valid').max(254),
	username: z
		.string()
		.regex(/^[a-zA-Z0-9_.]*$/, 'Username hanya boleh huruf, angka, titik, underscore')
		.max(30)
		.optional()
		.or(z.literal('')),
	password: z.string().min(8, 'Password minimal 8 karakter').max(72),
	signupEnabled: z.enum(['on', 'off']),
	loginMethod: z.enum(['password', 'google', 'both']),
	usernameLogin: z.enum(['on', 'off']),
	verificationMode: z.enum(['required', 'optional', 'auto_domain']),
	autoVerifyDomains: z.string().max(500).optional().or(z.literal('')),
	resetMode: z.enum(['email', 'admin'])
}).default({
	name: '',
	email: '',
	username: '',
	password: '',
	signupEnabled: 'on',
	loginMethod: 'both',
	usernameLogin: 'on',
	verificationMode: 'optional',
	autoVerifyDomains: '',
	resetMode: 'email'
});

export const load: PageServerLoad = async () => {
	if (await isConfigInitialized()) redirect(303, '/setup');
	return {
		form: await superValidate(zod4(wizardSchema)),
		googleConfigured: Boolean((await import('$env/dynamic/private')).env.GOOGLE_CLIENT_ID)
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(wizardSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian form.', { status: 400 });
		if (await isConfigInitialized()) {
			return message(form, 'Setup sudah selesai sebelumnya.', { status: 403 });
		}

		let response: Response;
		try {
			response = await auth.api.signUpEmail({
				body: {
					name: sanitizeText(form.data.name, 64),
					email: sanitizeEmail(form.data.email),
					password: form.data.password,
					username:
						form.data.username && form.data.username.length > 0
							? sanitizeText(form.data.username, 30)
							: undefined
				},
				asResponse: true
			});
		} catch {
			return message(form, 'Gagal membuat akun owner. Coba lagi nanti.', { status: 400 });
		}
		if (!response.ok) {
			return message(form, await apiErrorMessage(response), { status: 400 });
		}

		await db
			.update(userTable)
			.set({ role: 'owner', emailVerified: true, updatedAt: new Date() })
			.where(eq(userTable.email, sanitizeEmail(form.data.email)));

		const domains = normalizeDomain(form.data.autoVerifyDomains ?? '');
		await setAuthFlags({
			signup_enabled: form.data.signupEnabled === 'on' ? 'true' : 'false',
			login_method: form.data.loginMethod,
			username_login: form.data.usernameLogin === 'on' ? 'true' : 'false',
			verification_mode: form.data.verificationMode,
			auto_verify_domains: domains.join(','),
			reset_mode: form.data.resetMode
		});

		await getAuthFlags();

		await applyAuthCookies(cookies, response);
		redirect(303, '/dashboard');
	}
};
