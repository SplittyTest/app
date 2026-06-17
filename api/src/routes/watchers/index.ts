import { requireRole } from '@/lib/Auth';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/watchers')

		// Get the list of watchers
		.get(requireRole('viewer'), async (req, res) => {
			const watchers = await DB.Watchers.getAll();
			res.status(200).json(watchers);
		})

		// Insert a watcher
		.post(requireRole('tester'), async (req, res) => {
			const watcher = await DB.Watchers.insert(req.body.watcher);

			if (watcher) {
				if (Array.isArray(watcher)) {
					return res.status(201).json(
						watcher.map((row) => {
							return {
								user_id: row.user_id,
								test_id: row.test_id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						user_id: watcher.user_id,
						test_id: watcher.test_id,
					});
				}
			}
			return res.status(200).json({});
		});

	router
		.route('/watchers/:id')

		// Get a single watcher
		.get(requireRole('viewer'), async (req, res) => {
			const watcher = await DB.Watchers.getById(req.params.id);
			res.status(200).json(watcher);
		})

		// Update a watcher
		.patch(requireRole('tester'), async (req, res) => {
			const result = DB.Watchers.updateById(req.params.id, req.body.watcher);
			res.status(200).json(result);
		})

		// Delete a watcher
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Watchers.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
