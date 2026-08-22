import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { forgotPasswordSchema } from '$lib/schemas';
import { auth } from '$lib/server/auth';
import { getAuthFlags } from '$lib/server/config';
import { sanitizeEmail } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const flags = await getAuthFlags();
	return {
		form: await superValidate(zod4(forgotPasswordSchema)),
		adminReset: flags.resetMode === 'admin'
	};
};

export const actions: Actions = {
	default: async ({ request, url }) => {
		const flags = await getAuthFlags();
		if (flags.resetMode === 'admin') {
			return message(await superValidate(request, zod4(forgotPasswordSchema)), 'Reset password dilakukan manual oleh admin.', { status: 403 });
		}

		const form = await superValidate(request, zod4(forgotPasswordSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian form.', { status: 400 });

		try {
			await auth.api.requestPasswordReset({
				body: {
					email: sanitizeEmail(form.data.email),
					redirectTo: new URL('/auth/reset-password', url.origin).toString()
				}
			});
		} catch {
			return message(form, 'Jika email terdaftar, tautan reset telah dikirim.');
		}

		return message(form, 'Jika email terdaftar, tautan reset telah dikirim.');
	}
};
