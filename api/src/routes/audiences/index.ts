import { requireRole } from '@/lib/Auth';
import { Audience } from '@/types/schemas';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/audiences')

		// Get the list of audiences
		.get(requireRole('viewer'), async (req, res) => {
			let audiences: Audience[] = [];
			if (req.query.filter && req.query.filter.subject_id) {
				audiences = await DB.Audiences.getByFilter(
					(eb: any) =>
						eb.and({
							subject_id: req.query.filter.subject_id,
						}),
					req.query.filter.subject_id,
				);
			} else {
				audiences = await DB.Audiences.getAll();
			}
			res.status(200).json(audiences);
		})

		// Insert an audience
		.post(requireRole('tester'), async (req, res) => {
			const audience = await DB.Audiences.insert(req.body.audience);

			if (audience) {
				if (Array.isArray(audience)) {
					return res.status(201).json(
						audience.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: audience.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router.route('/audiences/:id/active-tests').get(requireRole('viewer'), async (req, res) => {
		const active_tests = await DB.Tests.getActiveTestCountForAudience(req.params.id);
		res.status(200).json({ active_tests });
	});

	router
		.route('/audiences/:id')

		// Get a single audience
		.get(requireRole('viewer'), async (req, res) => {
			const audience = await DB.Audiences.getById(req.params.id);
			res.status(200).json(audience);
		})

		// Update an audience
		.patch(requireRole('tester'), async (req, res) => {
			const result = await DB.Audiences.updateById(req.params.id, req.body.audience);
			res.status(200).json(result);
		})

		// Delete an audience
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Audiences.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
