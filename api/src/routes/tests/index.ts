import { requireRole } from '@/lib/Auth';
import Cache from '@/lib/Cache';
import { ExperimentError } from '@/lib/Errors/ExperimentError';
import log from '@/lib/Logger';
import { calculateScores } from '@/lib/SplitTest/calculateScores';
import { changeTestStatus } from '@/lib/SplitTest/changeTestStatus';
import { Metric } from '@/types/schemas';
import DB from '@lib/DB';
import { Router } from 'express';
import hash from 'hash-it';
import { forIn, sortBy } from 'lodash-es';
import { asyncForEach } from 'modern-async';

export default function (router: Router) {
	router
		.route('/tests')

		// Get the list of tests
		.get(requireRole('viewer'), async (req, res) => {
			const tests = await DB.Tests.getList(req.query?.filter);
			res.status(200).json(tests);
		})

		// Insert a test
		.post(requireRole('tester'), async (req, res) => {
			const insert_test = req.body.test;
			try {
				insert_test.created_by = req.user?.id;
				const test = await DB.Tests.insert(insert_test);

				if (test) {
					if (Array.isArray(test)) {
						return res.status(201).json(
							test.map((row) => {
								return {
									id: row.id,
								};
							}),
						);
					} else {
						return res.status(201).json({
							id: test.id,
						});
					}
				}
			} catch (err) {
				log.error('Error in POST /tests:', err);
			}
			return res.status(200).json({});
		});

	router
		.route('/tests/:id')

		// Get a single test
		.get(requireRole('viewer'), async (req, res) => {
			const test = await DB.Tests.getById(req.params.id);
			res.status(200).json(test);
		})

		// Update a test
		.patch(requireRole('tester'), async (req, res) => {
			const result = await DB.Tests.updateById(req.params.id, req.body.test);

			// Recalculate results if the test is active or paused
			if (result) {
				if (['active', 'paused'].includes(result.status)) {
					calculateScores(result.id);
				}
			}

			res.status(200).json(result);
		})

		// Delete a test
		.delete(requireRole('tester'), async (req, res) => {
			const result = await DB.Tests.deleteById(req.params.id);
			res.status(200).json(result);
		});

	router
		.route('/tests/:id/details')

		// Get all details for a test
		.get(requireRole('viewer'), async (req, res) => {
			const [test, status_logs, comments] = await Promise.all([
				DB.Tests.getExpandedById(req.params.id),
				DB.StatusLogs.getByTestId(req.params.id),
				DB.Comments.getByTestId(req.params.id),
			]);

			// Get the segment options
			const data = await DB.Tests.getResultsById(req.params.id, test?.status);
			const segments = await DB.Tests.getSegments(data);

			// Return the results
			res.status(201).json({
				test,
				data,
				status_logs,
				comments,
				segments,
			});
		});

	router
		.route('/tests/:id/metrics')

		// Get metrics explorer data for a test
		.get(requireRole('viewer'), async (req, res) => {
			const results: Record<string, any> = {};
			const test = await DB.Tests.getExpandedById(req.params.id);
			if (test) {
				await asyncForEach(
					test.metric_details,
					async (metric: any) => {
						results[metric.id] = await calculateScores(test.id, metric.id);
					},
					5,
				);
			}

			// Get the correct segment and format the data
			const segments = ((req.query as any).segments || []) as string[];
			let segment_hash = hash(segments).toString();
			if (segments.length === 0 || segments.every((segment: string) => segment === '')) {
				segment_hash = 'default';
			}

			const output: any[] = [];
			Object.keys(results).forEach((metric_id) => {
				const metric = test?.metric_details.find((m: any) => m.id === metric_id);

				if (metric) {
					let metric_values: any[] = [];
					let min_range: number | undefined;
					let max_range: number | undefined;
					forIn(results[metric_id][segment_hash], (variation_data, variation_id) => {
						const variation = test?.variations.find((v: any) => v.id === variation_id);

						if (min_range === undefined || variation_data.variation_score_range[0] < min_range) {
							min_range = variation_data.variation_score_range[0];
						}
						if (max_range === undefined || variation_data.variation_score_range[1] > max_range) {
							max_range = variation_data.variation_score_range[1];
						}

						metric_values.push({
							metric_id,
							metric_name: metric.name,
							display_type: metric.type,
							variation_id,
							variation_name: variation?.description,
							views: variation_data.view_count,
							events: variation_data.event_count,
							rate: variation_data.event_rate,
							value: variation_data.variation_score,
							range: variation_data.variation_score_range,
							position: [0, 1],
						});
					});

					const total_range = max_range! - min_range!;
					min_range = min_range! - total_range * 0.1;
					max_range = max_range! + total_range * 0.1;
					metric_values = metric_values.map((variation_data) => {
						variation_data.position = [
							(variation_data.range[0] - min_range!) / (max_range! - min_range!),
							(variation_data.range[1] - min_range!) / (max_range! - min_range!),
						];
						return variation_data;
					});

					// Add the values to the output
					output.push(...metric_values);
				}
			});

			// Sort the results by metric name and then variation name
			const sorted_output = sortBy(output, ['metric_name', 'variation_name']);

			// Return the results
			res.status(201).json(sorted_output);
		});

	router
		.route('/tests/:id/series-data')

		// Get the series data for a test
		.get(requireRole('viewer'), async (req, res) => {
			const test = await DB.Tests.getExpandedById(req.params.id);
			if (test) {
				let metric: Metric | undefined = test.decision_metric;
				if ((req.query as any).metric_id) {
					metric = test.metric_details.find((m: any) => m.id === (req.query as any).metric_id);
					if (!metric) {
						throw new ExperimentError('Metric not found', {
							test_id: req.params.id,
							metric_id: (req.query as any).metric_id,
						});
					}
				}

				const segments = ((req.query as any).segments || []) as string[];
				let segment_hash = hash((req.query as any).segments || []).toString();
				if (
					segments === undefined ||
					segments.length === 0 ||
					segments.every((segment: string) => segment === '')
				) {
					segment_hash = 'default';
				}

				const series_data = await Cache.get(`series_data:${test.id}:${metric.id}:${segment_hash}`, async () => {
					return await DB.OLAP.getTestSeriesData(test, metric, segments);
				});
				return res.status(200).json(series_data);
			}
			throw new ExperimentError('Test not found', {
				test_id: req.params.id,
			});
		});

	router
		.route('/tests/:id/status')

		// Change the status of a test
		.patch(requireRole('tester'), async (req, res) => {
			// Check if the test exists
			const test = await DB.Tests.getById(req.params.id);
			if (test) {
				const status = await changeTestStatus(test, req.body.status, req.user?.id);
				if (status) {
					return res.status(200).json({
						test_id: req.params.id,
						...status,
					});
				}
			}

			throw new ExperimentError('Test status could not be changed', {
				test_id: req.params.id,
				reason: 'The selected test was not found',
			});
		});
}
