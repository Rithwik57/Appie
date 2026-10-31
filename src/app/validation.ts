import { SIMULATED_CARE_PLAN_VARIANTS } from '../domain/copy';
import type { DoctorDecisionType, Episode, PaymentMethod } from '../domain/types';

const errors = (fieldErrors: Record<string, string>) => ({ code: 'VALIDATION_FAILED' as const, message: 'Please correct the highlighted information.', fieldErrors });
const trimmedLength = (value: string) => value.trim().length;
export const isNoteRequired = (decision: DoctorDecisionType, guidanceEdited: boolean, episode: Episode): boolean => ['decline_routine', 'request_more_info', 'escalate_urgent', 'route_teleconsult'].includes(decision) || guidanceEdited || episode.pharmacistChecks.at(-1)?.outcome === 'flagged_to_doctor';
export const validateDoctorNote = (note: string, required: boolean) => required && trimmedLength(note) < 10 ? errors({ note: 'Add a short reason (at least 10 characters). It is recorded in the audit history.' }) : trimmedLength(note) > 1000 ? errors({ note: 'Keep this under 1000 characters.' }) : null;
export const validateGuidance = (guidance: string | null) => guidance === null || trimmedLength(guidance) === 0 ? errors({ guidance: 'Choose a simulated care-plan variant.' }) : !SIMULATED_CARE_PLAN_VARIANTS.includes(trim(guidance) as typeof SIMULATED_CARE_PLAN_VARIANTS[number]) ? errors({ guidance: 'Choose one of the safe simulated care-plan variants.' }) : null;
export const validateFlagReason = (reason: string) => trimmedLength(reason) < 10 ? errors({ reason: 'Explain what the doctor needs to look at (at least 10 characters).' }) : trimmedLength(reason) > 500 ? errors({ reason: 'Keep this under 500 characters.' }) : null;
export const validateResponse = (response: string) => trimmedLength(response) === 0 ? errors({ response: 'Add a reply for the doctor.' }) : trimmedLength(response) > 1000 ? errors({ response: 'Keep this under 1000 characters.' }) : null;
export const validateTeleconsultNote = (note: string) => trimmedLength(note) > 300 ? errors({ note: 'Keep this under 300 characters.' }) : null;
export const validatePaymentMethod = (method: PaymentMethod | null) => method === null || !['upi', 'card', 'wallet'].includes(method) ? errors({ method: 'Choose a payment method (simulated).' }) : null;
export const trim = (value: string) => value.trim();
