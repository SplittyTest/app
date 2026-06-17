import { requireRole } from '@lib/Auth';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/comments')

		// Get comments
		.get(requireRole('viewer'), async (req, res) => {
			const object_filter: Record<string, any> = {};

			if (req.query.filter) {
				// Filter to a specific test
				if (req.query.filter.test_id) {
					object_filter.test_id = req.query.filter.test_id;
				}

				// Filter to a specific user
				if (req.query.filter.user_id) {
					object_filter.user_id = req.query.filter.user_id;
				}
			}

			const comments = await DB.Comments.getByFilter((eb: any) => {
				return eb.and(object_filter);
			});
			res.status(200).json(comments);
		})

		// Insert a new comment
		.post(requireRole('viewer'), async (req, res) => {
			// Set the user_id to the current user
			req.body.comment.user_id = req.user?.id;
			const comment = await DB.Comments.insert(req.body.comment);
			return res.status(200).json(comment);
		});

	router
		.route('/comments/test/:test_id')

		// Get comments
		.get(requireRole('viewer'), async (req, res) => {
			const comments = await DB.Comments.getByTestId(req.params.test_id);
			res.status(200).json(comments);
		});

	router
		.route('/comments/:id')

		// Get a single comment
		.get(requireRole('viewer'), async (req, res) => {
			const comment = await DB.Comments.getById(req.params.id);
			return res.status(200).json(comment);
		})

		// Update an comment
		.patch(requireRole('viewer'), async (req, res) => {
			// Users can only update their own comments
			const result = await DB.Comments.updateById(req.params.id, req.body.comment, (eb: any) => {
				return eb('user_id', '=', req.user?.id);
			});
			res.status(200).json(result);
		})

		// Delete an comment
		.delete(requireRole('viewer'), async (req, res) => {
			// Users can only delete their own comments
			const result = await DB.Comments.deleteById(req.params.id, (eb: any) => {
				return eb('user_id', '=', req.user?.id);
			});
			res.status(200).json(result);
		});
}
