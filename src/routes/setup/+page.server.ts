import { runDiagnostics } from '$lib/server/diagnostics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return { checks: await runDiagnostics(url.origin), origin: url.origin };
};
