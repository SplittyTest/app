/// <reference types="vite/client" />
import $API from '@lib/API';
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router';
import type { ToastServiceMethods } from 'primevue/toastservice';
import type { ConfirmationServiceMethods } from 'primevue/confirmationservice';
import type { SessionStore } from '@stores/SessionStore';
declare module '@components';

declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$API: typeof $API;
		$confirm: ConfirmationServiceMethods;
		$route: RouteLocationNormalizedLoaded;
		$router: Router;
		$sessionStore: SessionStore;
		$toast: ToastServiceMethods;
	}
}
