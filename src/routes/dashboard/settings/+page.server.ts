import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { message, superValidate } from 'sveltekit-superforms/server';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod';
import { getAuthFlags, normalizeDomain, setAuthFlags } from '$lib/server/config';
import type { Actions, PageServerLoad } from './$types';

const settingsSchema = z.object({
	signupEnabled: z.enum(['on', 'off']),
	loginMethod: z.enum(['password', 'google', 'both']),
	usernameLogin: z.enum(['on', 'off']),
	verificationMode: z.enum(['required', 'optional', 'auto_domain']),
	autoVerifyDomains: z.string().max(500).default(''),
	resetMode: z.enum(['email', 'admin'])
}).default({
	signupEnabled: 'on',
	loginMethod: 'both',
	usernameLogin: 'on',
	verificationMode: 'optional',
	autoVerifyDomains: '',
	resetMode: 'email'
});

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/auth/sign-in');
	const role = locals.user.role ?? 'user';
	if (role !== 'owner' && role !== 'admin') redirect(303, '/dashboard');
	const flags = await getAuthFlags();
	return {
		form: await superValidate(
			{
				signupEnabled: flags.signupEnabled ? 'on' : 'off',
				loginMethod: flags.loginMethod,
				usernameLogin: flags.usernameLogin ? 'on' : 'off',
				verificationMode: flags.verificationMode,
				autoVerifyDomains: flags.autoVerifyDomains.join(','),
				resetMode: flags.resetMode
			},
			zod4(settingsSchema)
		)
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && locals.user.role !== 'admin')) {
			return fail(403, { form: undefined });
		}
		const form = await superValidate(request, zod4(settingsSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian.', { status: 400 });

		await setAuthFlags({
			signup_enabled: form.data.signupEnabled === 'on' ? 'true' : 'false',
			login_method: form.data.loginMethod,
			username_login: form.data.usernameLogin === 'on' ? 'true' : 'false',
			verification_mode: form.data.verificationMode,
			auto_verify_domains: normalizeDomain(form.data.autoVerifyDomains).join(','),
			reset_mode: form.data.resetMode
		});

		return message(form, 'Pengaturan disimpan.');
	}
};
