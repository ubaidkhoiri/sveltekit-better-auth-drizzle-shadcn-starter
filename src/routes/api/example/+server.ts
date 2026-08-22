import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exampleSchema } from '$lib/schemas';
import { sanitizeText, validateJson } from '$lib/server/validation';

/**
 * Contoh endpoint dengan pola wajib: cek session -> validasi Zod -> sanitasi input.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const data = await validateJson(request, exampleSchema);

	return json({ echo: sanitizeText(data.message, 500) });
};
