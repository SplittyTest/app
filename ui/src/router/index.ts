import useToast from '@/lib/utils/useToast';
import { useSessionStore } from '@/stores/session';
import AudienceForm from '@/views/Audiences/Form.vue';
import AudiencesList from '@/views/Audiences/List.vue';
import ForgotPassword from '@/views/Auth/ForgotPassword.vue';
import Login from '@/views/Auth/Login.vue';
import ResetPassword from '@/views/Auth/ResetPassword.vue';
import MetricForm from '@/views/Metrics/Form.vue';
import MetricsList from '@/views/Metrics/List.vue';
import ProjectForm from '@/views/Projects/Form/Form.vue';
import ProjectsList from '@/views/Projects/List.vue';
import Settings from '@/views/Settings/Settings.vue';
import SplitTestDetails from '@/views/SplitTests/Details.vue';
import SplitTestForm from '@/views/SplitTests/Form/Form.vue';
import SplitTestList from '@/views/SplitTests/List.vue';
import Private from '@views/Private.vue';
import Public from '@views/Public.vue';
import { createRouter, createWebHistory, type RouteLocationRaw } from 'vue-router';

const routes = [
	// Public routes
	{
		path: '/',
		component: Public,
		children: [
			{
				path: '/',
				redirect: '/projects',
			},
			{
				path: 'login',
				component: Login,
			},
			{
				path: 'forgot-password',
				component: ForgotPassword,
			},
			{
				path: 'reset-password',
				component: ResetPassword,
			},
		],
	},

	// Private routes
	{
		path: '/',
		component: Private,
		children: [
			{
				path: 'projects',
				children: [
					{
						path: '',
						name: 'ProjectsList',
						component: ProjectsList,
					},
					{
						path: 'edit/new',
						name: 'ProjectCreate',
						component: ProjectForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'edit/:project_id',
						name: 'ProjectEdit',
						component: ProjectForm,
						meta: {
							role: 'tester',
						},
					},
				],
			},
			{
				path: 'split-tests',
				children: [
					{
						path: '',
						name: 'SplitTestsList',
						component: SplitTestList,
					},
					{
						path: 'edit/new',
						name: 'SplitTestCreate',
						component: SplitTestForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'edit/:test_id',
						name: 'SplitTestEdit',
						component: SplitTestForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'details/:test_id',
						name: 'SplitTestDetails',
						component: SplitTestDetails,
					},
				],
			},
			{
				path: 'metrics',
				children: [
					{
						path: '',
						name: 'MetricsList',
						component: MetricsList,
					},
					{
						path: 'edit/new',
						name: 'MetricCreate',
						component: MetricForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'edit/:metric_id',
						name: 'MetricEdit',
						component: MetricForm,
						meta: {
							role: 'tester',
						},
					},
				],
			},
			{
				path: 'audiences',
				children: [
					{
						path: '',
						name: 'AudiencesList',
						component: AudiencesList,
					},
					{
						path: 'edit/new',
						name: 'AudienceCreate',
						component: AudienceForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'edit/:audience_id',
						name: 'AudienceEdit',
						component: AudienceForm,
						meta: {
							role: 'tester',
						},
					},
				],
			},
			{
				path: 'settings/:section?',
				children: [
					{
						path: '',
						name: 'Settings',
						component: Settings,
						meta: {
							role: 'tester',
						},
					},
				],
			},
		],
		meta: {
			private: true,
		},
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

/**
 * Login page location that sends the user back to `redirect` after signing in.
 */
export function loginLocation(redirect?: string): RouteLocationRaw {
	if (!redirect || redirect === '/' || redirect.startsWith('/login')) {
		return { path: '/login' };
	}
	return { path: '/login', query: { redirect } };
}

router.beforeEach(async (to) => {
	const sessionStore = useSessionStore();
	const toast = useToast();

	if (to.meta.private) {
		const had_user = !!sessionStore.user;
		const authenticated = await sessionStore.checkAuth();

		// Not signed in (or the session expired): send them to the login page
		if (!authenticated) {
			if (had_user) {
				sessionStore.setFlashMessage('Your session has expired. Please log in again.', 'danger', 5000);
			} else {
				sessionStore.setFlashMessage('Please log in to continue', 'info', 5000);
			}
			return loginLocation(to.fullPath);
		}
	}

	// Check if the user has permissions for the route
	if (to.meta.role && !sessionStore.minRole(to.meta.role as string)) {
		toast.add({
			summary: 'Access Denied',
			detail: 'You do not have permission to access this page.',
			severity: 'danger',
			life: 5000,
		});
		return false;
	}
	return true;
});

export default router;
