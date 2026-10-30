import Cache from '@lib/Cache';
import DB from '@lib/DB';
import { Webhook } from '@lib/DB/tables/webhooks/webhook.schema';
import log from '@lib/Logger';
import { filterMatch } from '@lib/Utils/filterMatch';
import { cloneDeep, isEmpty, merge } from 'lodash-es';
import { asyncForEach } from 'modern-async';
import { ExpressionBuilder } from 'kysely';
import { DBStore } from '@/types/schemas';
import { assertSafeWebhookUrl } from '@/lib/Utils/safeWebhookUrl';

export const webhook = {
	trigger: 'webhook',
	handler: async (params: { event: string; data: any }) => {
		const { event, data } = params;

		try {
			// Get the webhooks
			// Cache per project (under db:webhooks:* so webhook changes clear it)
			const webhooks = (await Cache.get<Webhook[]>(`db:webhooks:byProject:${data.project_id}`, async () => {
				return await DB.Webhooks.getByFilter((eb: ExpressionBuilder<DBStore, 'webhooks'>) =>
					eb.and({ project_id: data.project_id, active: true }),
				);
			})) as Webhook[];

			const filtered_webhooks = webhooks.filter((webhook) => {
				// Check data filters and event triggers of the webhook
				if (webhook.events && webhook.events.length > 0) {
					let filter_match = true;

					// Check against data filters if they exist
					if (webhook.filters && webhook.filters.length > 0) {
						filter_match = filterMatch(webhook.filters, data);
					}

					return filter_match && webhook.events.includes(event);
				}
			});

			// Since we do not return anything, this can be done asynchronously without awaiting the result
			asyncForEach(
				filtered_webhooks,
				async (webhook) => {
					try {
						const cloned_webhook = cloneDeep(webhook);
						merge(cloned_webhook.body, data);

						// Re-check at send time: DNS for the host may have changed since it was saved
						const url = await assertSafeWebhookUrl(cloned_webhook.url);
						const method = cloned_webhook.method || 'POST';

						const response = await fetch(url, {
							method,
							headers: {
								'Content-Type': 'application/json',
								...cloned_webhook.headers,
							},
							// GET requests can't carry a body
							body: method === 'GET' ? undefined : JSON.stringify(cloned_webhook.body),
							// Don't follow redirects, which could lead to internal addresses
							redirect: 'manual',
							signal: AbortSignal.timeout(10000),
						});

						log.info(
							{
								webhook_id: webhook.id,
								event,
								status: response.status,
							},
							'Sent webhook for event',
						);
					} catch (err) {
						log.error(err, `Error sending webhook ${webhook.id} for event ${event}`);
					}
				},
				10,
			);
		} catch (err) {
			log.error(err, 'Error sending webhook');
		}
	},
};
