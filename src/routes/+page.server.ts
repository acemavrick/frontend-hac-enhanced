import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// root page just redirects to the right place
export const load: PageServerLoad = async ({ parent }) => {
	const { user, needsSetup } = await parent();

	if (needsSetup) redirect(302, '/setup');
	if (user) redirect(302, '/attendance');
	redirect(302, '/login');
};
