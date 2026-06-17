import Cache from '@lib/Cache';
import DB from '@lib/DB';
import { Webhook } from '@lib/DB/tables/webhooks/webhook.schema';
import log from '@lib/Logger';
import { filterMatch } from '@lib/Utils/filterMatch';
import { cloneDeep, isEmpty, merge } from 'lodash-es';
import { asyncForEach } from 'modern-async';
import { ExpressionBuilder } from 'kysely';
import { DBStore } from '@/types/schemas';

export const webhook = {
	trigger: 'webhook',
	handler: async (params: { event: string; data: any }) => {
		const { event, data } = params;

		try {
			// Get the webhooks
			const webhooks = (await Cache.get<Webhook[]>('webhooks', async () => {
				return await DB.Webhooks.getByFilter((eb: ExpressionBuilder<DBStore, 'webhooks'>) =>
					eb.and({ subject_id: data.subject_id, active: true }),
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

						const response = await fetch(cloned_webhook.url, {
							method: cloned_webhook.method || 'POST',
							headers: {
								...cloned_webhook.headers,
							},
							body: JSON.stringify(cloned_webhook.body),
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
