import DB from '@/lib/DB';
import log from '@/lib/Logger';
import { calculateScores } from '@/lib/SplitTest/calculateScores';
import isArrayWithLength from '@/lib/Utils/isArrayWithLength';
import { zEventSchema, zSessionSchema } from '@/types/schemas';
import { NextFunction, Request, Response } from 'express';
import { mergeWith, set, uniq } from 'lodash-es';
import { ulid } from 'ulid';

export async function logEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
	// Get the session info
	log.trace('logEvent body:', req.body);
	log.trace('logEvent session:', req.sessionID, req.session ? 'present' : 'missing');

	const raw_session = {
		...req.session,
		id: req.sessionID || req.session.id,
		created_at: (req.session as any).created_at || new Date().toISOString(),
	};

	const session = await zSessionSchema.parseAsync(raw_session);

	// Create a new event object with the required properties
	const new_event = {
		id: ulid(),
		session_id: session.id,
		type: req.body.type,
		subject_id: req.subject_id || req.user?.subject_id,
		test_ids: session.test_ids || [],
		variation_ids: session.variation_ids || [],
		value: req.body.value,
		created_at: new Date(),
	};

	// Merge new data and session data
	const raw_event: any = mergeWith(
		new_event,
		{ data: session.data },
		{ data: req.body.data },
		(src: any, obj: any) => {
			if (Array.isArray(src) && Array.isArray(obj)) {
				return uniq([...src, ...obj]);
			}
		},
	);

	// Parse the raw event
	const event = await zEventSchema.parseAsync(raw_event);

	// Do not log events for filtered IP addresses
	if (req.session && !session.filtered_ip) {
		log.trace('Traffic not filtered');

		// Get the subject settings to determine if we should log unknown events
		// This is cached at the class level
		const subject = await DB.Subjects.getById(raw_event.subject_id);
		const subject_settings = subject?.settings || {};

		// Check if the user has participated in any tests
		const is_participant = isArrayWithLength(event.test_ids);

		// Check if there is a metric defined for this event type
		// This is cached at the class level
		const metric = await DB.Metrics.getByEventType(raw_event.subject_id, raw_event.type);
		let is_tracked_metric = false;
		let is_known_metric = false;
		if (metric) {
			// The metric is defined
			is_known_metric = true;

			// Check if the metric exists in any tests in the session
			const tracked_metrics = await DB.Tests.getTrackedMetricsByTestIds(session.test_ids);
			is_tracked_metric = tracked_metrics.includes(metric.id);
		}

		// Now we need to figure out if the event should be logged
		// We log the event by default
		let log_event = true;

		// The the event is unknown and we do not want to log unknown events, do not log the event
		if (!is_known_metric && !subject_settings.log_unknown_events) {
			log_event = false;
		}

		// If the event is untracked and we do not want to log untracked events, do not log the event
		if (log_event && !is_tracked_metric && !subject_settings.log_untracked_events) {
			log_event = false;
		}

		// The event is for a non-participant...
		if (log_event && !is_participant) {
			// ...and it is an unknown event
			if (!is_known_metric) {
				// ...and we do not want to log unknown events for non-participants
				if (!subject_settings.unknown_events_idle_logging) {
					log_event = false;
				}

				// ...or if the random percentage check does not pass
				else {
					// We add the sample rate to the event so we know what percentage of events are being logged when there are no active tests
					set(
						req.session,
						'data.$unknown_event_sample_rate',
						subject_settings.unknown_events_idle_logging_percentage,
					);
					if (Math.random() > (subject_settings.unknown_events_idle_logging_percentage || 0)) {
						log_event = false;
					}
				}
			}

			// ...it is a known metric
			else {
				// ...and we do not want to track it for non-participants
				if (metric?.idle_logging === false) {
					log_event = false;
				}

				// ...or if the random percentage check does not pass
				else {
					// We add the sample rate to the event so we know what percentage of events are being logged when there are no active tests
					set(req.session, 'data.$event_sample_rate', metric?.idle_logging_percentage);
					if (Math.random() > (metric?.idle_logging_percentage || 0)) {
						log_event = false;
					}
				}
			}
		}

		// Log the event if it passes all checks
		if (log_event) {
			log.trace('Event passed logging checks');

			// Update the session with the new event data
			const updated_session = zSessionSchema.omit({ filtered_ip: true }).parse(raw_event);
			// Insert or overwrite the session with the merged event
			await DB.OLAP.insertSession(updated_session);

			// Save the event to ClickHouse
			await DB.OLAP.insertEvent(event);
		}

		// We can send back the response before we calculate the scores
		res.status(201).json({
			event_id: event.id,
			session_id: event.session_id,
		});

		// Check if we should recalculate the results
		const active_tests = await DB.Tests.getActiveIds();
		session.test_ids.forEach((test_id) => {
			if (active_tests.includes(test_id)) {
				DB.Dict.exists(`test:${test_id}:no_calculate`)
					.then((flag) => {
						if (!flag) {
							calculateScores(test_id).catch((err) => {
								log.error({ err, test_id }, 'calculateScores failed');
							});
							DB.Tests.getExpandedById(test_id)
								.then((test) => {
									if (test && test.decision_metric?.event_type === event.type) {
										return DB.Dict.set(`test:${test_id}:no_calculate`, '1').then(() => {
											return DB.Dict.expire(
												`test:${test_id}:no_calculate`,
												test.calculation_interval || 300,
											);
										});
									}
								})
								.catch((err) => {
									log.warn('Unable to get test');
								});
						}
					})
					.catch((err) => {
						log.error({ err }, 'DB.Dict check failed in logEvent');
					});
			}
		});
	}

	// Send an empty response to filtered IP addresses
	else {
		res.status(204).send();
	}
}
