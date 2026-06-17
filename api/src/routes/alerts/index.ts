import { requireRole } from '@lib/Auth';
import shortHash from '@lib/Utils/shortHash';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/alerts')

		// Only get alerts for the current user
		.get(requireRole('viewer'), async (req, res) => {
			const alerts = await DB.Alerts.getByFilter((eb: any) => {
				return eb('user_id', '=', req.user?.id);
			}, req.user?.id);
			res.status(200).json(alerts);
		})

		// Update all alerts for the current user
		// Used to mark all alerts as read or unread
		.patch(requireRole('viewer'), async (req, res) => {
			const result = DB.Alerts.updateByFilter((eb: any) => {
				return eb('user_id', '=', req.user?.id);
			}, req.body.alert);
			res.status(200).json(result);
		});

	router
		.route('/alerts/:id')

		// Get a single alert
		.get(requireRole('viewer'), async (req, res) => {
			const alert = await DB.Alerts.getById(req.params.id);
			if (alert?.user_id === req.user?.id) {
				return res.status(200).json(alert);
			}
			return res.status(200).json(null);
		})

		// Update an alert
		.patch(requireRole('viewer'), async (req, res) => {
			const result = await DB.Alerts.updateById(req.params.id, req.body.alert, (eb: any) => {
				return eb('user_id', '=', req.user?.id);
			});

			if (!result) {
				return res.status(404).json({ error: 'Alert not found' });
			}
			res.status(200).json(result);
		})

		// Delete an alert
		.delete(requireRole('viewer'), async (req, res) => {
			const result = await DB.Alerts.deleteById(req.params.id, (eb: any) => {
				return eb('user_id', '=', req.user?.id);
			});

			if (!result) {
				return res.status(404).json({ error: 'Alert not found' })
			}
			res.status(200).json(result);
		});
}
