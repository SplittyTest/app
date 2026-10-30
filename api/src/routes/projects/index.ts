import { requireRole } from '@/lib/Auth';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/projects')

		// Get the list of projects
		.get(requireRole('viewer'), async (req, res) => {
			const projects = await DB.Projects.getList();
			res.status(200).json(projects);
		})

		// Insert a project
		.post(requireRole('tester'), async (req, res) => {
			const project = await DB.Projects.insert(req.body.project);

			if (project) {
				if (Array.isArray(project)) {
					return res.status(201).json(
						project.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: project.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router
		.route('/projects/:id')

		// Get a single project
		.get(requireRole('viewer'), async (req, res) => {
			const project = await DB.Projects.getById(req.params.id);
			res.status(200).json(project);
		})

		// Update a project
		.patch(requireRole('tester'), async (req, res) => {
			const result = DB.Projects.updateById(req.params.id, req.body.project);
			res.status(200).json(result);
		})

		// Delete a project
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Store.transaction().execute(async (tx) => {
				await DB.Tests.deleteByFilter((eb: any) => eb('project_id', '=', req.params.id));
				return await DB.Projects.deleteById(req.params.id);
			});
			res.status(200).json(result);
		});
}
