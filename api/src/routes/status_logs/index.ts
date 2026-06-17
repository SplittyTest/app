import { requireRole } from '@/lib/Auth';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/status-logs/:test_id')

		// Get a single status log
		.get(requireRole('viewer'), async (req, res) => {
			const status_logs = await DB.StatusLogs.getByTestId(req.params.test_id);
			res.status(200).json(status_logs);
		});
}
