import '@formatjs/intl-numberformat';
// import '@formatjs/intl-numberformat/locale-data/en';
import { useSessionStore } from '@/stores/Session';

export function percentage(value: number, precision: number = 2): string {
	const sessionStore = useSessionStore();
	const locale = sessionStore.settings.locale || 'en-US';
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: precision,
		maximumFractionDigits: precision,
		style: 'percent',
	}).format(value);
}

export default percentage;
