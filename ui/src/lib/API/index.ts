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

client.interceptors.response.use(
	(response) => response,
	// Errored Response
	(err: any) => {
		const { error, reason } = err.response.data;

		const toast = useToast();
		toast.add({
			severity: 'danger',
			summary: error || 'An Unknown Error Occured',
			detail: reason,
			life: 5000,
		});
		throw err;
	},
);

export function useAPI(): AxiosInstance {
	return client;
}
