import { zAPIKeySchema } from '@/types/schemas';
import { requireRole } from '@lib/Auth';
import DB from '@lib/DB';
import Cache from '@lib/Cache';
import bcrypt from 'bcrypt';
import { type Router } from 'express';
import omit from 'lodash-es/omit';
import { APIKey, generateKey } from '@/lib/DB/tables/api_keys/api_key.schema';
import { deleteByPrefix, validateKey } from '@/lib/DB/tables/api_keys';

export default function (router: Router) {
	router
		.route('/api-keys')

		.get(requireRole('tester'), async (req, res) => {
			if (req.query.refresh) {
				await Cache.clean('db:api_keys:getAll');
			}
			const api_keys = await DB.APIKeys.getAll();
			res.status(200).json(api_keys.map((api_key) => omit(api_key, ['key'])));
		})

		// Insert an API key
		.post(requireRole('tester'), async (req, res) => {
			// Remove the prefix and key on insert
			delete req.body.api_key.prefix;
			delete req.body.api_key.key;

			const valid_results = zAPIKeySchema.safeParse({ ...req.body.api_key });

			if (!valid_results.success) {
				return res.status(400).json({
					reason: 'Bad request',
					data: valid_results.error,
				});
			}

			const api_key = valid_results.data;

			const return_key = api_key.prefix + '-' + api_key.key;

			// hash the key before inserting it
			api_key.key = await bcrypt.hash(return_key, 12);
			await DB.APIKeys.insert(api_key);

			return res.status(201).json({
				key: return_key,
				message: 'Will only show this once',
			});
		});

	// Generate a new API key
	router.route('/api-keys/:prefix/generate').patch(requireRole('tester'), async (req, res) => {
		const key = await generateKey();
		const new_key = req.params.prefix + '-' + key;

		// hash the key before inserting it
		const hashed_key = await bcrypt.hash(new_key, 12);
		await DB.APIKeys.updateByPrefix(req.params.prefix, { key: hashed_key });

		res.status(200).json({
			key: new_key,
			message: 'Will only show this once',
		});
	});

	router
		.route('/api-keys/:prefix')

		// Get a single API key
		.get(requireRole('tester'), async (req, res) => {
			const api_key = await DB.APIKeys.getByPrefix(req.params.prefix);
			return res.status(200).json(api_key ? omit(api_key, ['key', 'prefix']) : null);
		})

		// Update an API key
		.patch(requireRole('tester'), async (req, res) => {
			// Remove the prefix and key on update
			delete req.body.api_key.prefix;
			delete req.body.api_key.key;

			await DB.APIKeys.updateByPrefix(req.params.prefix, req.body.api_key);

			res.status(200).json({
				message: 'Successfully updated API key',
			});
		})

		// Delete an API key
		.delete(requireRole('tester'), async (req, res) => {
			await deleteByPrefix(req.params.prefix);
			res.status(200).json({
				message: 'Successfully deleted API key',
			});
		});
}
