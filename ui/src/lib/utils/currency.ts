import '@formatjs/intl-numberformat';
import '@formatjs/intl-numberformat/locale-data/en';
import { useSessionStore } from '@/stores/Session';

export function currency(value: number) {
	const sessionStore = useSessionStore();
	const locale = sessionStore.settings.locale || 'en-US';
	const currency = sessionStore.settings.currency || 'USD';
	return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export default currency;
