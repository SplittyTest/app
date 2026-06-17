import Dict from './Dict';
import OLAP from './OLAP';
import Store from './Store';
import * as Alerts from './tables/alerts';
import * as APIKeys from './tables/api_keys';
import * as Audiences from './tables/audiences';
import * as Comments from './tables/comments';
import * as Metrics from './tables/metrics';
import * as Settings from './tables/settings';
import * as StatusLogs from './tables/status_logs';
import * as Subjects from './tables/subjects';
import * as Tests from './tables/tests';
import * as TestResults from './tables/test_results';
import * as Users from './tables/users';
import * as Watchers from './tables/watchers';
import * as Webhooks from './tables/webhooks';

export default {
	Dict,
	OLAP,
	Store,

	// Tables
	Alerts,
	APIKeys,
	Audiences,
	Comments,
	Metrics,
	Settings,
	StatusLogs,
	Subjects,
	Tests,
	TestResults,
	Users,
	Watchers,
	Webhooks,
};
