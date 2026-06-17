import { requireRole } from '@/lib/Auth';
import { Setting } from '@/types/schemas';
import DB from '@lib/DB';
import { type Router } from 'express';
import { forIn, omit } from 'lodash-es';
import { asyncForEach } from 'modern-async';

export default function (router: Router) {
	router
		.route('/settings')

		// Get all the settings for the UI
		.get(requireRole('viewer'), async (req, res) => {
			const settings = await DB.Settings.getById(['locale', 'currency', 'filtered_ips']);
			res.status(200).json(settings);
		})

		// Insert a setting
		.post(requireRole('admin'), async (req, res) => {
			// Convert a settings object into rows
			const insert_settings: Setting[] = [];
			forIn(req.body.settings, (value, id) => {
				insert_settings.push({
					id,
					value,
				});
			});

			const settings = await DB.Settings.insert(insert_settings);
			if (settings) {
				if (Array.isArray(settings)) {
					return res.status(201).json(
						settings.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: settings.id,
					});
				}
			}
			return res.status(200).json({});
		})

		// Update a settings using object
		.patch(requireRole('admin'), async (req, res) => {
			// Convert a settings object into rows
			await asyncForEach(Object.keys(req.body.settings), async (key) => {
				await DB.Settings.updateById(key, { value: req.body.settings[key] });
			});

			const settings = await DB.Settings.getById(['locale', 'currency', 'filtered_ips']);
			return res.status(200).json(settings);
		});

	router
		.route('/settings/:id')

		// Get a single setting
		.get(requireRole('viewer'), async (req, res) => {
			const setting = await DB.Settings.getById(req.params.id);
			res.status(200).json(setting);
		})

		// Update a setting
		.patch(requireRole('tester'), async (req, res) => {
			const result = await DB.Settings.updateById(req.params.id, omit(req.body, ['id']));
			res.status(200).json(result);
		})

		// Delete a setting
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Settings.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
