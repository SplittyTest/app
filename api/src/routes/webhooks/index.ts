import { requireRole } from '@/lib/Auth';
import Cache from '@/lib/Cache';
import { assertSafeWebhookUrl } from '@/lib/Utils/safeWebhookUrl';
import DB from '@lib/DB';
import { type Request, type Router } from 'express';

// Webhook headers often carry credentials for the receiving service, so only admins see their values
function redactForRole(req: Request, webhook: any) {
	if (!webhook || req.user?.role === 'admin') return webhook;
	const headers = webhook.headers
		? Object.fromEntries(Object.keys(webhook.headers).map((key) => [key, '********']))
		: webhook.headers;
	return { ...webhook, headers };
}

export default function (router: Router) {
	router
		.route('/webhooks')

		// Get the list of webhooks
		.get(requireRole('viewer'), async (req, res) => {
			if (req.query.refresh) {
				await Cache.clean('db:webhooks:getAll');
			}
			const webhooks = await DB.Webhooks.getAll();
			res.status(200).json(webhooks.map((webhook) => redactForRole(req, webhook)));
		})

		// Insert a webhook
		.post(requireRole('admin'), async (req, res) => {
			const webhooks = Array.isArray(req.body.webhook) ? req.body.webhook : [req.body.webhook];
			for (const webhook of webhooks) {
				await assertSafeWebhookUrl(webhook?.url);
			}
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
			res.status(200).json(redactForRole(req, webhook));
		})

		// Update a webhook (admin only, like creating one: the URL and headers decide where event data goes)
		.patch(requireRole('admin'), async (req, res) => {
			if (req.body.webhook?.url !== undefined) {
				await assertSafeWebhookUrl(req.body.webhook.url);
			}
			const result = await DB.Webhooks.updateById(req.params.id, req.body.webhook);
			res.status(200).json(result);
		})

		// Delete a webhook
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Webhooks.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
