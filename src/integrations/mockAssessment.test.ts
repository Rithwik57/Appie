import { mockAssessment } from './mockAssessment';
import type { SymptomIntake } from '../domain/types';
const intake: SymptomIntake = { subject: 'self', concernArea: 'stomach_upset', duration: '1_3_days', severity: 'mild', warningSigns: 'no', freeText: 'Ignored free text', submittedAt: null };
describe('mockAssessment', () => { it('uses only structured intake data', () => { expect(mockAssessment({ ...intake, freeText: 'different' }, { now: () => 'now' })).toEqual(mockAssessment(intake, { now: () => 'now' })); }); it('marks warning answers potentially urgent', () => expect(mockAssessment({ ...intake, warningSigns: 'yes' }, { now: () => 'now' }).category).toBe('possibly_urgent')); });
