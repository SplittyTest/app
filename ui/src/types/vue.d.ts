import type { useSessionStore } from '@/stores/Session';
import Vue from 'vue';

declare module 'vue/types/vue' {
	interface Vue {
		$root: {
			sessionStore: typeof useSessionStore;
			// Add other properties or methods as needed
		} & Vue; // Extend with Vue's own properties
	}
}
