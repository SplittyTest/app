
import { Session, Test } from '@/types/schemas';
import { Variation } from '@/types/schemas';

export interface AnalysisStrategy {
    calculate(test_id: string): Promise<void>;
    selectVariation(test: Test, session: Session): Promise<Variation>;
}
