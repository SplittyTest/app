import { ExpandedTest } from '@/types/schemas';
import { AnalysisStrategy } from './Strategy';
import { AutoOptimizeStrategy } from './Strategies/AutoOptimize';
import { StandardStrategy } from './Strategies/Standard';

export function getStrategy(test: ExpandedTest): AnalysisStrategy {
	if (test.strategy === 'auto_optimize') {
		return new AutoOptimizeStrategy();
	}
	// Default to standard
	return new StandardStrategy();
}
