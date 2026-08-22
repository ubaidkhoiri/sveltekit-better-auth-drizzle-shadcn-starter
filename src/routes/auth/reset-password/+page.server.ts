import { redirect } from '@sveltejs/kit';
import { zod4 } from 'sveltekit-superforms/adapters';
import { message, superValidate } from 'sveltekit-superforms/server';
import { resetPasswordSchema } from '$lib/schemas';
import { applyAuthCookies, auth } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') ?? '';
	return { form: await superValidate({ token }, zod4(resetPasswordSchema)) };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await superValidate(request, zod4(resetPasswordSchema));
		if (!form.valid) return message(form, 'Periksa kembali isian form.', { status: 400 });

		let response: Response;
		try {
			response = await auth.api.resetPassword({
				body: { newPassword: form.data.password, token: form.data.token },
				asResponse: true
			});
		} catch {
			return message(
				form,
				'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.',
				{ status: 400 }
			);
		}

		if (!response.ok) {
			return message(
				form,
				'Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.',
				{ status: 400 }
			);
		}

		await applyAuthCookies(cookies, response);
		redirect(303, '/dashboard');
	}
};
