import DB from '@lib/DB';
import { ExperimentError } from '@lib/Errors/ExperimentError';
import { Session } from '@/types/schemas';
import hash from 'hash-it';
import { isNil, isUndefined } from 'lodash-es';
import { getStrategy } from '../Analysis';

// Select the next test variation in line for a test
export async function selectTestVariation(test_id: string, session: Session) {
	// Get the test
	const test = await DB.Tests.getExpandedById(test_id);

	if (!test) {
		throw new ExperimentError('The selected test could not be found', {
			test_id,
		});
	}

	// Use the analysis strategy to select the variation
	const strategy = getStrategy(test);
	return strategy.selectVariation(test, session);
}
