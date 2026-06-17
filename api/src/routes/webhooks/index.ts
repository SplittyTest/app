import { requireRole } from '@/lib/Auth';
import Cache from '@/lib/Cache';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/webhooks')

		// Get the list of webhooks
		.get(requireRole('viewer'), async (req, res) => {
			if (req.query.refresh) {
				await Cache.clean('db:webhooks:getAll');
			}
			const webhooks = await DB.Webhooks.getAll();
			res.status(200).json(webhooks);
		})

		// Insert a webhook
		.post(requireRole('admin'), async (req, res) => {
			const webhook = await DB.Webhooks.insert(req.body.webhook);

			if (webhook) {
				if (Array.isArray(webhook)) {
					return res.status(201).json(
						webhook.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: webhook.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router
		.route('/webhooks/:id')

		// Get a single webhook
		.get(requireRole('viewer'), async (req, res) => {
			const webhook = await DB.Webhooks.getById(req.params.id);
			res.status(200).json(webhook);
		})

		// Update a webhook
		.patch(requireRole('tester'), async (req, res) => {
			const result = DB.Webhooks.updateById(req.params.id, req.body.webhook);
			res.status(200).json(result);
		})

		// Delete a webhook
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Webhooks.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
