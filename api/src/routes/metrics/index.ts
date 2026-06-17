import { requireRole } from '@/lib/Auth';
import { Metric } from '@/types/schemas';
import DB from '@lib/DB';
import { type Router } from 'express';

export default function (router: Router) {
	router
		.route('/metrics')

		// Get the list of metrics
		.get(requireRole('viewer'), async (req, res) => {
			let metrics: Metric[] = [];
			if (req.query.filter && req.query.filter.subject_id) {
				metrics = await DB.Metrics.getByFilter(
					(eb: any) =>
						eb.and({
							subject_id: req.query.filter.subject_id,
						}),
					req.query.filter.subject_id,
				);
			} else {
				metrics = await DB.Metrics.getAll();
			}
			res.status(200).json(metrics);
		})

		// Insert an metric
		.post(requireRole('tester'), async (req, res) => {
			const metric = await DB.Metrics.insert(req.body.metric);

			if (metric) {
				if (Array.isArray(metric)) {
					return res.status(201).json(
						metric.map((row) => {
							return {
								id: row.id,
							};
						}),
					);
				} else {
					return res.status(201).json({
						id: metric.id,
					});
				}
			}
			return res.status(200).json({});
		});

	router.route('/metrics/:id/segments').get(requireRole('viewer'), async (req, res) => {
		const date_range = (req.query as any).date_range as [Date, Date];
		const metric = await DB.Metrics.getById(req.params.id);

		if (metric) {
			const segments = await DB.OLAP.getMetricSegments(metric, date_range);
			res.status(200).json(segments);
		} else {
			throw new Error('Metric not found');
		}
	});

	router.route('/metrics/:id/series-data').get(requireRole('viewer'), async (req, res) => {
		const date_range = (req.query as any).date_range as [Date, Date];
		const segments = (req.query as any).segments as Record<string, any>;
		const group_by = (req.query as any).group_by as 'variation_id' | 'test_id' | 'aggregate';
		const control = (req.query as any).control === 'true';
		const metric = await DB.Metrics.getById(req.params.id);

		if (metric) {
			const data = await DB.OLAP.getMetricSeriesData(metric, {
				date_range,
				segments,
				group_by,
				control,
			});
			res.status(200).json(data);
		} else {
			throw new Error('Metric not found');
		}
	});

	router
		.route('/metrics/:id')

		// Get a single metric
		.get(requireRole('viewer'), async (req, res) => {
			const metric = await DB.Metrics.getById(req.params.id);
			res.status(200).json(metric);
		})

		// Update an metric
		.patch(requireRole('tester'), async (req, res) => {
			const result = await DB.Metrics.updateById(req.params.id, req.body.metric);
			res.status(200).json(result);
		})

		// Delete an metric
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Metrics.deleteById(req.params.id);
			res.status(200).json(result);
		});
}
