import { AudienceFilter } from '../DB/tables/audiences/audience.schema';
import { filterMatch } from './filterMatch';

export function matchAudience(data: Record<string, any>, audience_filters: AudienceFilter[]): boolean {
	if (!audience_filters || audience_filters.length === 0) {
		return true;
	}

	return filterMatch(data, audience_filters);
}
