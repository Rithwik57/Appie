import type { DeliveryStatus, DoctorDecisionType, PaymentMethod, Role, SymptomIntake } from '../domain/types';

export type Action =
  | { type: 'START_EPISODE' }
  | { type: 'ACCEPT_CONSENT'; episodeId: string }
  | { type: 'DECLINE_CONSENT'; episodeId: string }
  | { type: 'SAVE_INTAKE_DRAFT'; episodeId: string; patch: Partial<Omit<SymptomIntake, 'subject' | 'submittedAt'>> }
  | { type: 'SUBMIT_INTAKE'; episodeId: string }
  | { type: 'REQUEST_TELECONSULT'; episodeId: string; note: string }
  | { type: 'ANSWER_MORE_INFO'; episodeId: string; response: string }
  | { type: 'PAY'; episodeId: string; method: PaymentMethod | null }
  | { type: 'ADVANCE_FULFILLMENT'; episodeId: string; to: DeliveryStatus }
  | { type: 'START_REVIEW'; episodeId: string }
  | { type: 'DOCTOR_DECIDE'; episodeId: string; decision: DoctorDecisionType; guidance: string | null; note: string }
  | { type: 'PHARMACIST_CONFIRM'; episodeId: string }
  | { type: 'PHARMACIST_FLAG'; episodeId: string; reason: string }
  | { type: 'SWITCH_ROLE'; role: Role }
  | { type: 'LOAD_SCENARIO'; scenario: 'routine' | 'urgent' | 'unclear' }
  | { type: 'SIGN_OUT' }
  | { type: 'RESET_DEMO' };
export type GlobalAction = Extract<Action, { type: 'START_EPISODE' | 'SWITCH_ROLE' | 'SIGN_OUT' | 'LOAD_SCENARIO' | 'RESET_DEMO' }>;
export type EpisodeAction = Exclude<Action, GlobalAction>;
export type TransitionError = { code: 'ILLEGAL_TRANSITION' | 'ROLE_NOT_PERMITTED' | 'EPISODE_NOT_FOUND' | 'VALIDATION_FAILED' | 'ROUTINE_BLOCKED' | 'ALREADY_DELIVERED' | 'PAYMENT_FAILED'; message: string; fieldErrors?: Record<string, string> };
export type TransitionResult = { ok: true; state: import('../domain/types').AppState; episodeId?: string } | { ok: false; error: TransitionError };
