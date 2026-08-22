import { json } from '@sveltejs/kit';
import { runDiagnostics } from '$lib/server/diagnostics';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const checks = await runDiagnostics(url.origin);
	return json({ checks });
};
