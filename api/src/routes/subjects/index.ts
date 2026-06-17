import { requireRole } from '@/lib/Auth';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/subjects')

		// Get the list of subjects
		.get(requireRole('viewer'), async (req, res) => {
			const subjects = await DB.Subjects.getList();
			res.status(200).json(subjects);
		})

		// Insert a subject
		.post(requireRole('tester'), async (req, res) => {
			const subject = await DB.Subjects.insert(req.body.subject);

			if (subject) {
				if (Array.isArray(subject)) {
					return res.status(201).json(
						subject.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: subject.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router
		.route('/subjects/:id')

		// Get a single subject
		.get(requireRole('viewer'), async (req, res) => {
			const subject = await DB.Subjects.getById(req.params.id);
			res.status(200).json(subject);
		})

		// Update a subject
		.patch(requireRole('tester'), async (req, res) => {
			const result = DB.Subjects.updateById(req.params.id, req.body.subject);
			res.status(200).json(result);
		})

		// Delete a subject
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Store.transaction().execute(async (tx) => {
				await DB.Tests.deleteByFilter((eb: any) => eb('subject_id', '=', req.params.id));
				return await DB.Subjects.deleteById(req.params.id);
			});
			res.status(200).json(result);
		});
}
