import axios, { type AxiosInstance } from 'axios';
import useToast from '@/lib/utils/useToast';

export const client = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	timeout: 2500,
	headers: {
		'Content-Type': 'application/json',
		'Cache-Control': 'no-cache',
	},
	withCredentials: true,
});

// The session check is handled by the router guard, which redirects quietly
function isAuthCheck(url: string = '') {
	return /(^|\/)api\/auth$/.test(url);
}

// When an API call says the session is gone while the user is on a private
// page, clear the user and send them to the login page. Imported lazily because
// the router and session store both import this module.
async function redirectToLogin(): Promise<boolean> {
	const [{ default: router, loginLocation }, { useSessionStore }] = await Promise.all([
		import('@/router'),
		import('@/stores/session'),
	]);
	const route = router.currentRoute.value;
	if (!route.meta.private) {
		return false;
	}

	const sessionStore = useSessionStore();
	sessionStore.user = null;
	sessionStore.setFlashMessage('Your session has expired. Please log in again.', 'danger', 5000);
	await router.push(loginLocation(route.fullPath));
	return true;
}

client.interceptors.response.use(
	(response) => response,
	// Errored Response
	async (err: any) => {
		const status = err.response?.status;

		if (isAuthCheck(err.config?.url)) {
			throw err;
		}

		if (status === 401 && (await redirectToLogin())) {
			throw err;
		}

		const { error, reason } = err.response?.data ?? {};
		const toast = useToast();
		toast.add({
			severity: 'danger',
			summary: error || (err.response ? 'An Unknown Error Occured' : 'Unable to reach the server'),
			detail: reason,
			life: 5000,
		});
		throw err;
	},
);

export function useAPI(): AxiosInstance {
	return client;
}
