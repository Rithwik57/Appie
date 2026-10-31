import type { DoctorDecisionType, Episode } from './types';

export const ALL_DOCTOR_DECISIONS: readonly DoctorDecisionType[] = [
  'approve_with_prescription', 'finalize_without_prescription', 'decline_routine',
  'request_more_info', 'escalate_urgent', 'route_teleconsult',
];

export const lastDecision = (episode: Episode) => episode.decisions.at(-1) ?? null;
export const isRoutineBlocked = (episode: Episode) => episode.escalatedAt !== null || episode.status === 'escalated_urgent';
export const hasOpenTeleconsult = (episode: Episode) =>
  episode.status === 'teleconsult_requested' ||
  (episode.status === 'escalated_urgent' && episode.helpRequests.some((request) => request.kind === 'teleconsult' && request.madeWhileEscalated));

/**
 * The doctor, pharmacist and payment gates an order must have passed before
 * Fulfillment / Delivery Operations may see or update it.
 */
export const isFulfillmentEligible = (episode: Episode): boolean => {
  if (isRoutineBlocked(episode)) return false;
  const prescription = episode.prescription;
  const check = episode.pharmacistChecks.at(-1);
  return (
    prescription !== null &&
    prescription.status === 'checked' &&
    lastDecision(episode)?.type === 'approve_with_prescription' &&
    check !== undefined &&
    check.outcome === 'confirmed' &&
    check.prescriptionVersion === prescription.version &&
    episode.order !== null &&
    episode.tracking !== null &&
    episode.order.paymentRef !== ''
  );
};
