import { CONCERN_LABELS, DURATION_LABELS, SEVERITY_LABELS, WARNING_LABELS } from '../domain/copy';
import type { ConcernArea, Duration, Severity, SymptomIntake, WarningSignAnswer } from '../domain/types';

export interface IntakeStep { field: keyof Pick<SymptomIntake, 'concernArea' | 'duration' | 'severity' | 'warningSigns' | 'freeText'>; question: string; required: boolean; options?: ReadonlyArray<{ value: string; label: string }>; }
const options = <T extends string>(labels: Record<T, string>): ReadonlyArray<{ value: string; label: string }> => Object.keys(labels).map((value) => ({ value, label: labels[value as T] }));
export const INTAKE_STEPS: readonly IntakeStep[] = [
  { field: 'concernArea', question: "What's bothering you most?", required: true, options: options<ConcernArea>(CONCERN_LABELS) },
  { field: 'duration', question: 'How long has this been going on?', required: true, options: options<Duration>(DURATION_LABELS) },
  { field: 'severity', question: 'How much is it affecting your day?', required: true, options: options<Severity>(SEVERITY_LABELS) },
  { field: 'warningSigns', question: 'Do you feel this could be an emergency, or are your symptoms getting much worse quickly?', required: true, options: options<WarningSignAnswer>(WARNING_LABELS) },
  { field: 'freeText', question: "Anything else you'd like the doctor to know?", required: false },
];
export type IntakeValidation = { valid: true } | { valid: false; fieldErrors: Record<string, string> };
export const validateIntakeStep = (step: number, intake: SymptomIntake): IntakeValidation => {
  const definition = INTAKE_STEPS[step - 1];
  if (definition === undefined) return { valid: false, fieldErrors: { step: 'Choose a valid intake step.' } };
  const value = intake[definition.field];
  if (definition.required && (value === null || value === '')) return { valid: false, fieldErrors: { [definition.field]: 'Choose an option to continue.' } };
  if (definition.field === 'freeText' && intake.freeText.length > 500) return { valid: false, fieldErrors: { freeText: 'Keep this under 500 characters.' } };
  return { valid: true };
};
export const validateIntake = (intake: SymptomIntake): IntakeValidation => {
  const fieldErrors: Record<string, string> = {};
  for (let step = 1; step <= INTAKE_STEPS.length; step += 1) { const outcome = validateIntakeStep(step, intake); if (!outcome.valid) Object.assign(fieldErrors, outcome.fieldErrors); }
  return Object.keys(fieldErrors).length === 0 ? { valid: true } : { valid: false, fieldErrors };
};
export const resumeIntakeStep = (intake: SymptomIntake): number => {
  for (let step = 1; step <= 4; step += 1) if (!validateIntakeStep(step, intake).valid) return step;
  return 5;
};
