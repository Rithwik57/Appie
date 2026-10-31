import { resumeIntakeStep, validateIntake } from './intake';
import type { SymptomIntake } from '../domain/types';
const blank: SymptomIntake = { subject: 'self', concernArea: null, duration: null, severity: null, warningSigns: null, freeText: '', submittedAt: null };
describe('intake validation', () => { it('requires structured answers', () => expect(validateIntake(blank).valid).toBe(false)); it('resumes at first unanswered step', () => expect(resumeIntakeStep({ ...blank, concernArea: 'stomach_upset' })).toBe(2)); });
