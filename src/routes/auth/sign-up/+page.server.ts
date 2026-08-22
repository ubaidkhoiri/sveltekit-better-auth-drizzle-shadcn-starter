import { redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { signUpSchema } from '$lib/schemas';
import { apiErrorMessage, applyAuthCookies, auth } from '$lib/server/auth';
import { getAuthFlags } from '$lib/server/config';
import { sanitizeEmail, sanitizeText } from '$lib/server/validation';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		form: await superValidate(zod4(signUpSchema)),
		flags: await getAuthFlags()
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const flags = await getAuthFlags();
		if (!flags.signupEnabled) {
			return message(await superValidate(request, zod4(signUpSchema)), 'Pendaftaran akun baru sedang ditutup.', { status: 403 });
		}

		const form = await superValidate(request, zod4(signUpSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian form.', { status: 400 });

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
			return message(form, 'Gagal mendaftar. Coba lagi nanti.', { status: 400 });
		}

		if (!response.ok) {
			return message(form, await apiErrorMessage(response), { status: 400 });
		}

		await applyAuthCookies(cookies, response);
		redirect(303, '/dashboard');
	}
};
