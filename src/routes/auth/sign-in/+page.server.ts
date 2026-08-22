import { redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { signInSchema } from '$lib/schemas';
import { apiErrorMessage, applyAuthCookies, auth } from '$lib/server/auth';
import { getAuthFlags } from '$lib/server/config';
import { sanitizeEmail } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(signInSchema)),
		flags: await getAuthFlags()
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const flags = await getAuthFlags();
		if (flags.loginMethod === 'google') {
			return message(await superValidate(request, zod4(signInSchema)), 'Login hanya melalui Google.', { status: 403 });
		}

		const form = await superValidate(request, zod4(signInSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian form.', { status: 400 });

		const identifier = form.data.email.trim();
		const isEmail = identifier.includes('@');

		let response: Response;
		try {
			if (isEmail) {
				response = await auth.api.signInEmail({
					body: { email: sanitizeEmail(identifier), password: form.data.password },
					asResponse: true
				});
			} else {
				if (!flags.usernameLogin) {
					return message(form, 'Login dengan username dinonaktifkan. Gunakan email.', { status: 400 });
				}
				response = await auth.api.signInUsername({
					body: { username: identifier, password: form.data.password },
					asResponse: true
				});
			}
		} catch {
			return message(form, 'Gagal masuk. Coba lagi nanti.', { status: 400 });
		}

		if (!response.ok) {
			return message(form, await apiErrorMessage(response), { status: 400 });
		}

		await applyAuthCookies(cookies, response);
		redirect(303, '/dashboard');
	}
};
