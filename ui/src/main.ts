import '@styles/theme.css';
import '@styles/variables.css';
import '@styles/main.less';
import App from '@views/App.vue';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';
import ConfirmDelete from '@/components/ConfirmDelete.vue';
import FormError from '@components/FormError.vue';
import Icon from '@components/Icon.vue';
import { FieldValidation } from '@splitty-test/validation';
import Aura from '@primeuix/themes/aura';
import router from './router';
import { client } from '@lib/API';
import { TextOverflowMarquee } from './lib/directives';
import { useSessionStore } from './stores/Session';
import { Chart as ChartJS } from 'chart.js';
import chartJSZoom from 'chartjs-plugin-zoom';

const pinia = createPinia();
export const app = createApp(App);

ChartJS.register(chartJSZoom);

app.config.globalProperties.$API = client;
app.config.globalProperties.$sessionStore = useSessionStore(pinia);

app.use(router);
app.use(pinia);
app.use(PrimeVue, {
	theme: {
		preset: Aura,
		options: {
			cssLayer: {
				name: 'primevue',
				order: 'theme, base, primevue',
			},
			darkModeSelector: '.dark',
		},
	},
});
app.use(ConfirmationService);
app.use(ToastService);
app.component('ConfirmDelete', ConfirmDelete);
app.component('FieldValidation', FieldValidation);
app.component('FormError', FormError);
app.component('Icon', Icon);
app.directive('textOverflowMarquee', TextOverflowMarquee);
app.mount('#app');
