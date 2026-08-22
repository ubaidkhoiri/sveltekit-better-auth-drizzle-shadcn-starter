import { redirect } from '@sveltejs/kit';
import { isConfigInitialized } from '$lib/server/config';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ url }) => {
	const path = url.pathname;
	const exempt =
		path.startsWith('/setup') ||
		path.startsWith('/auth') ||
		path.startsWith('/api') ||
		path === '/favicon.ico';

	if (!exempt && !(await isConfigInitialized())) {
		redirect(303, '/setup/wizard');
	}

	return {};
};
