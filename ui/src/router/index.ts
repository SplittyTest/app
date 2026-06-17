import { createWebHistory, createRouter } from 'vue-router';
import Home from '@/views/Home.vue';
import Login from '@/views/Auth/Login.vue';
import ForgotPassword from '@/views/Auth/ForgotPassword.vue';
import ResetPassword from '@/views/Auth/ResetPassword.vue';
import Private from '@views/Private.vue';
import Public from '@views/Public.vue';
import AudienceForm from '@/views/Audiences/Form.vue';
import AudiencesList from '@/views/Audiences/List.vue';
import MetricForm from '@/views/Metrics/Form.vue';
import MetricsList from '@/views/Metrics/List.vue';
import Settings from '@/views/Settings/Settings.vue';
import SplitTestDetails from '@/views/SplitTests/Details.vue';
import SplitTestForm from '@/views/SplitTests/Form/Form.vue';
import SplitTestList from '@/views/SplitTests/List.vue';
import SubjectForm from '@/views/Subjects/Form/Form.vue';
import SubjectsList from '@/views/Subjects/List.vue';
import { useSessionStore } from '@/stores/Session';
import useToast from '@/lib/utils/useToast';

const routes = [
	// Public routes
	{
		path: '/',
		component: Public,
		children: [
			{
				path: '/',
				component: Home,
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
				path: 'subjects',
				children: [
					{
						path: '',
						name: 'SubjectsList',
						component: SubjectsList,
					},
					{
						path: 'edit/new',
						name: 'SubjectCreate',
						component: SubjectForm,
						meta: {
							role: 'tester',
						},
					},
					{
						path: 'edit/:subject_id',
						name: 'SubjectEdit',
						component: SubjectForm,
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

router.beforeEach(async (to) => {
	const sessionStore = useSessionStore();
	const toast = useToast();

	try {
		if (to.meta.private) {
			await sessionStore.checkAuth();
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
	} catch (err: any) {
		// Redirect to login for auth errors
		if (err.response?.status === 401) {
			sessionStore.setFlashMessage('You have been logged out', 'danger', 5000);
			return { path: '/login?!' };
		}
	}
});

export default router;
