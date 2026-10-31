import { REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import type { Assessment, SymptomIntake } from '../domain/types';
import type { AssessmentService, BoundaryInfo } from './types';

export const ASSESSMENT_BOUNDARY: BoundaryInfo = { name: 'Mock assessment service', status: 'mock', note: 'Local simulated assessment – no external connection' };

export const mockAssessment: AssessmentService = (intake: SymptomIntake, clock): Omit<Assessment, 'id'> => {
  const urgent = intake.warningSigns === 'yes';
  const needsInput = intake.warningSigns === 'not_sure' || intake.severity === 'severe' || intake.concernArea === 'something_else';
  const category = urgent ? 'possibly_urgent' : needsInput ? 'needs_human_input' : 'looks_routine';
  return {
    category,
    simulatedConfidence: urgent ? 'high' : needsInput ? 'low' : intake.duration === 'over_1_week' ? 'medium' : 'high',
    summary: category === 'possibly_urgent'
      ? 'Your answers may need urgent in-person attention. The routine prototype flow is paused.'
      : category === 'needs_human_input'
        ? 'Your answers need more human input before any simulated care guidance is considered.'
        : 'Your answers describe a concern that may be suitable for routine remote care. A doctor will review this before any care plan is given.',
    suggestedGuidance: REVIEWER_APPROVED_GUIDANCE,
    createdAt: clock.now(),
    source: 'mock-assessment-v1',
    isSimulated: true,
  };
};
