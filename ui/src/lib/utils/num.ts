import { useSessionStore } from '@/stores/Session';

export function num(value: number) {
	const sessionStore = useSessionStore();
	const locale = sessionStore.settings.locale || 'en-US';
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
		style: 'decimal',
	}).format(value);
}

export default num;
