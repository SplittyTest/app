import DB from '@lib/DB';
import { Variation } from '@lib/DB/tables/tests/test.schema';
import { ExperimentError } from '../Errors/ExperimentError';

// Return a list of potential tests to serve for a given subject and section
export async function getTestVariationById(variation_id: string) {
	// Split the variation_id to get the test_id
	const [test_id] = variation_id.split('-');

	// The get test
	const test = await DB.Tests.getById(test_id);

	// Throw if the test could not be found
	if (!test) {
		throw new ExperimentError('The test was missing', {
			test_id,
		});
	}

	// Select the matching variation
	const variation = test.variations.find((variation: Variation) => {
		return variation.id === variation_id;
	});

	// Throw if the variation could not be found
	if (!variation) {
		throw new ExperimentError('The variation was missing', {
			test_id,
			variation_id,
		});
	}

	return variation;
}
