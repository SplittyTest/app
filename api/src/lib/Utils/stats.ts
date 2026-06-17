const confidence_z_scores: { [confidence_level: number]: number } = {
	0.6: 0.842,
	0.7: 1.036,
	0.75: 1.15,
	0.8: 1.282,
	0.85: 1.44,
	0.9: 1.645,
	0.95: 1.96,
	0.99: 2.576,
};

// Return whether the variation has confidence over the control at the given confidence level
export function hasConfidence(
	control: [number, number],
	variation: [number, number],
	confidence_level: number = 0.95,
): boolean {
	const z_score = zScore(control, variation);

	const z = confidence_z_scores[confidence_level];
	if (!z) {
		throw new Error(`Unsupported confidence level: ${confidence_level}`);
	}

	return Math.abs(z_score) > z;
}

// Calculate the z-score for the difference in conversion rates between the control and variation groups
export function zScore(control: [number, number], variation: [number, number]): number {
	const control_rate = control[0] / control[1];
	const variation_rate = variation[0] / variation[1];

	const se_control = Math.sqrt(Math.abs((control_rate * (1 - control_rate)) / control[1]));
	const se_variation = Math.sqrt(Math.abs((variation_rate * (1 - variation_rate)) / variation[1]));

	const se_diff = Math.sqrt(se_control ** 2 + se_variation ** 2);
	const rate_diff = variation_rate - control_rate;

	const z_score = rate_diff / se_diff;

	return z_score;
}
