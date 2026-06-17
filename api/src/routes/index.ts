import { Router } from 'express';
import alertsRoutes from './alerts';
import apiKeysRoutes from './api_keys';
import audiencesRoutes from './audiences';
import authRoutes from './auth';
import commentsRoutes from './comments';
import experimentRoutes from './split-test';
import metricsRoutes from './metrics';
import settingsRoutes from './settings';
import statusLogsRoutes from './status_logs';
import subjectsRoutes from './subjects';
import testsRoutes from './tests';
import usersRoutes from './users';
import watchersRoutes from './watchers';
import webhookRoutes from './webhooks';

export async function apiRoutes(router: Router) {
	alertsRoutes(router);
	apiKeysRoutes(router);
	audiencesRoutes(router);
	authRoutes(router);
	commentsRoutes(router);
	metricsRoutes(router);
	settingsRoutes(router);
	statusLogsRoutes(router);
	subjectsRoutes(router);
	testsRoutes(router);
	usersRoutes(router);
	watchersRoutes(router);
	webhookRoutes(router);
}

export { experimentRoutes };
