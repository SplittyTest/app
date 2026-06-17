import DB from '@lib/DB';
import log from '@lib/Logger';
import { sendWebhook } from '@lib/Utils/webhook';
import { asyncForEach } from 'modern-async';
import { ulid } from 'ulid';

export async function changeVariationStatus(
	variation_id: string,
	new_status: string,
	reason?: string,
	user_id?: string,
) {
	const timestamp = new Date();

	// Get the test from the variation_id
	const [test_id] = variation_id.split('-');
	const test = await DB.Tests.getById(test_id);

	if (test) {
		const variation = test.variations.find((v) => {
			return variation_id === v.id;
		});

		// Get all variation queues
		const queue_keys = await DB.Dict.getKeys(`test:${test.id}:variations_queue:*`);

		if (variation) {
			// You should only be able to unpause a variation if the test is auto-optimized
			if (new_status === 'active' && test.strategy === 'auto_optimize') {
				variation.status = 'active';

				// Add the variation back into the front of all the queues
				asyncForEach(queue_keys, async (queue_key) => {
					await DB.Dict.lpush(queue_key, Array(variation.weight || 1).fill(variation_id));
				});

				// Update the status logs
				DB.StatusLogs.insert({
					id: ulid(),
					test_id: test?.id,
					type: 'variation',
					data: {
						variation_id,
						status: 'active',
						reason,
						user_id,
					},
					created_at: timestamp,
				}).catch((err) => {
					log.error(
						{
							test_id: test?.id,
							status: 'active',
						},
						'Unable to update the status logs',
						err,
					);
				});
			}

			// Pause a variation
			if (new_status === 'paused') {
				variation.status = 'paused';

				// Remove the variation from all the queues
				asyncForEach(queue_keys, async (queue_key) => {
					await DB.Dict.lrem(queue_key, 0, variation_id);
				});

				// Update the status logs
				DB.StatusLogs.insert({
					id: ulid(),
					test_id: test?.id,
					type: 'variation',
					data: {
						variation_id,
						status: 'paused',
						reason,
						user_id,
					},
					created_at: timestamp,
				}).catch((err) => {
					log.error(
						{
							test_id: test?.id,
							status: 'active',
						},
						'Unable to update the status logs',
						err,
					);
				});
			}

			// Send a webhook
			sendWebhook('variation_status', {
				subject_id: test.subject_id,
				test_id: test.id,
				variation_id,
				old_status: variation.status,
				new_status: new_status,
			});

			DB.Dict.unlink(`db:tests:${test_id}`).catch((err) => {
				log.warn(
					{
						test_id: test?.id,
					},
					'Unable to clear cache for test',
					err,
				);
			});
		}
	}
}
