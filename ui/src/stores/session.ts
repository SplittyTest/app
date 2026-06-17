import { defineStore } from 'pinia';
import { cloneDeep, sortBy } from 'lodash-es';
import { useAPI } from '@lib/API';

type Severity = 'danger' | 'warn' | 'success' | 'info' | 'help' | 'secondary' | 'contrast';
export interface FlashMessageConfig {
	severity: Severity;
	summary: string;
	detail?: string;
	life?: number;
}

const $API = useAPI();

export const useSessionStore = defineStore('session', {
	state: () => {
		return {
			user: null as { id: string; first_name: string; last_name: string; email: string; role: string } | null,
			alerts: [] as any[],
			last_page: null as string | null,
			flash: null as any,
			settings: {
				locale: 'en-US',
				currency: 'USD',
				allow_unpausing_variations: false,
			},
			outcome_modal: {
				show: false,
				test_id: null as string | null,
				test_name: '',
			},
			subject_options: [] as { label: string; value: string }[],
			user_options: [] as { label: string; value: string }[],
		};
	},
	getters: {
		alertCount(state) {
			// This should be updated to return the true count of alerts
			return state.alerts.length;
		},
		isViewer(state) {
			return state.user?.role === 'viewer';
		},
		isTester(state) {
			return state.user?.role === 'tester';
		},
		isAdmin(state) {
			return state.user?.role === 'admin';
		},
	},
	actions: {
		async init() {
			await Promise.all([this.getSettings(), this.getSubjectsAsOptions(), this.getUsersAsOptions()]);
		},
		async getSettings() {
			const { data } = await $API.get('/api/settings');
			if (data) {
				this.settings = data;
			}
		},
		async getUsersAsOptions() {
			if (this.user?.role === 'admin') {
				const { data } = await $API.get(`/api/users`);
				this.user_options = sortBy(data, 'name').map((user) => {
					const option = {
						label: `${user.first_name} ${user.last_name}`,
						value: user.id,
					};

					return option;
				});
			}
		},
		async getSubjectsAsOptions() {
			const { data } = await $API.get(`/api/subjects`);
			this.subject_options = sortBy(data, 'name').map((subject) => {
				const option = {
					label: subject.name,
					value: subject.id,
					sections: [] as any[],
				};

				if (Array.isArray(subject.sections)) {
					option.sections = sortBy(subject.sections, 'name').map((section) => ({
						label: section.id,
						value: section.id,
						description: section.description,
						preview_url: section.preview_url,
						data: section.data,
					}));
				}

				return option;
			});
		},
		async checkAuth() {
			// Returns true if auth check passes
			const { data } = await $API.get('api/auth');
			if (data.user) {
				this.user = data.user;
			}
		},
		minRole(role: string) {
			// Default to the lowest access level if no user is found
			const user_role = this.user?.role || 'viewer';

			if (user_role === 'admin' || role === 'viewer') {
				return true;
			} else if (role === 'tester' && ['tester', 'admin'].includes(user_role)) {
				return true;
			} else if (role === 'commenter' && user_role !== 'viewer') {
				return true;
			}
			return false;
		},
		async login(data: { email: string; password: string }) {
			const response = await $API.post('/api/login', data);
			if (response?.data?.user) {
				return response.data.user;
			}
			return null;
		},
		async logout() {
			const response = await $API.post('/api/logout');
			if (response?.data?.message) this.setFlashMessage(response?.data?.message, 'danger');
			return true;
		},
		setFlashMessage(message: string | FlashMessageConfig, severity: Severity, life: number = 5000) {
			if (typeof message === 'string') {
				this.$patch((state) => {
					state.flash = {};

					state.flash.summary = message;
					state.flash.severity = severity || 'info';
					state.flash.life = life;
				});
			} else {
				this.$patch((state) => {
					state.flash = message;
				});
			}
		},
		clearFlashMessage() {
			this.$patch((state) => {
				state.flash = null;
			});
		},
		getFlashMessage() {
			if (this.flash) {
				const toast_config = cloneDeep(this.flash);
				if (this.flash.life === 0) {
					delete toast_config.life;
				}
				this.clearFlashMessage();
				return toast_config;
			}
			return null;
		},
	},
});
