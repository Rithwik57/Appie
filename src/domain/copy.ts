import type { AuditAction, ConcernArea, DeliveryStatus, DoctorDecisionType, Duration, PrescriptionItem, Role, Severity, WarningSignAnswer } from './types';
import type { EpisodeStatus } from './status';

export const PROTOTYPE_DISCLAIMER = 'Simulated prototype for demonstration only. Content is illustrative and not medical advice.';
export const SAMPLE_IDENTITY_LABEL = 'Sample / demo identity';
export const SIMULATED_PRESCRIPTION_NOTICE = 'Simulated prescription details – not a valid prescription. Demonstration content only.';
export const MOCK_BOUNDARY_NOTICE = 'Mock integration boundary – not connected';
export const DEMO_ROLE_NOTICE = 'Simulated demo role · not a sign-in';
export const NO_PASSWORD_NOTICE = 'No password, account or backend sign-in. Choosing a role only changes which demo workspace you see; it is not authentication or access control.';
export const EMERGENCY_GUIDANCE = 'Contact local emergency services, such as 112 in India, or seek immediate in-person care. Appie cannot manage an emergency.';
export const REVIEWER_APPROVED_GUIDANCE = 'Reviewer-approved care plan (simulated placeholder). This demonstration does not show medical advice or treatment instructions.';
export const SIMULATED_CARE_PLAN_VARIANTS = [
  REVIEWER_APPROVED_GUIDANCE,
  'Reviewer-approved care plan (simulated follow-up variant). This demonstration keeps care-plan content non-clinical and does not show medical advice or treatment instructions.',
  'Reviewer-approved care plan (simulated monitoring variant). This demonstration keeps care-plan content non-clinical and does not show medical advice or treatment instructions.',
] as const;

export const PLACEHOLDER_ITEMS: ReadonlyArray<PrescriptionItem> = [
  { label: 'Demo medication item A', instructionsPlaceholder: 'As directed in the reviewer-approved care plan (simulated)' },
  { label: 'Demo supportive care item B', instructionsPlaceholder: 'As directed in the reviewer-approved care plan (simulated)' },
];

export const ROLE_LABELS: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  pharmacist: 'Pharmacist',
  ops: 'Fulfillment / Delivery Operations',
};
export const ACTOR_ROLE_LABELS: Record<Role | 'system', string> = { ...ROLE_LABELS, ops: 'Operations', system: 'System (mock service)' };

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  order_placed: 'Order received',
  preparing: 'Preparing',
  dispatched: 'Dispatched',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export const DOCTOR_DECISION_LABELS: Record<DoctorDecisionType, string> = {
  approve_with_prescription: 'Approve guidance and simulated prescription',
  finalize_without_prescription: 'Finalise guidance without prescription',
  decline_routine: 'Decline routine path',
  request_more_info: 'Request more information',
  escalate_urgent: 'Escalate to urgent in-person care',
  route_teleconsult: 'Route to human teleconsultation',
};
export const PATIENT_DECISION_LABELS: Record<DoctorDecisionType, string> = {
  approve_with_prescription: 'Care guidance and simulated prescription approved',
  finalize_without_prescription: 'Care guidance finalised without a prescription',
  decline_routine: 'Routine path declined',
  request_more_info: 'More information requested',
  escalate_urgent: 'Escalated to urgent in-person care',
  route_teleconsult: 'Routed to human teleconsultation',
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  episode_started: 'Health check started',
  consent_accepted: 'Consent accepted',
  consent_declined: 'Consent declined',
  intake_submitted: 'Intake submitted',
  ai_summary_created: 'Preliminary assessment created (simulated)',
  patient_escalated: 'Routine flow paused (urgent)',
  review_started: 'Doctor review started',
  approve_with_prescription: 'Doctor approved simulated care plan',
  finalize_without_prescription: 'Doctor finalised guidance without prescription',
  decline_routine: 'Doctor declined routine path',
  request_more_info: 'Doctor requested more information',
  escalate_urgent: 'Doctor escalated to urgent care',
  route_teleconsult: 'Doctor routed to teleconsultation',
  more_info_answered: 'Patient replied with more information',
  teleconsult_requested: 'Teleconsultation requested',
  pharmacist_confirmed: 'Pharmacist confirmed check',
  pharmacist_flagged: 'Pharmacist flagged to doctor',
  payment_simulated: 'Simulated payment completed',
  order_created: 'Order received',
  delivery_status_changed: 'Fulfillment status changed',
};

export const CONCERN_LABELS: Record<ConcernArea, string> = {
  cold_cough_throat: 'Cold, cough or sore throat',
  stomach_upset: 'Stomach upset',
  skin_irritation: 'Skin irritation',
  aches_pains: 'Headache or body aches',
  something_else: 'Something else',
};
export const DURATION_LABELS: Record<Duration, string> = { under_1_day: 'Less than a day', '1_3_days': '1–3 days', '4_7_days': '4–7 days', over_1_week: 'More than a week' };
export const SEVERITY_LABELS: Record<Severity, string> = { mild: 'Mild: I can carry on as usual', moderate: "Moderate: it's slowing me down", severe: "Severe: I can't do my usual activities" };
export const WARNING_LABELS: Record<WarningSignAnswer, string> = { no: 'No', not_sure: 'Not sure', yes: 'Yes' };
export const OUTCOME_LABELS: Record<EpisodeStatus, string> = {
  consent_pending: 'Consent needed',
  consent_declined: 'Consent declined – no information collected',
  intake_in_progress: 'Intake in progress',
  awaiting_doctor_review: 'Awaiting doctor review (simulated)',
  in_doctor_review: 'Doctor review in progress (simulated)',
  more_info_requested: 'More information requested (simulated)',
  teleconsult_requested: 'Teleconsultation requested (simulated)',
  escalated_urgent: 'Escalated – routine flow paused',
  declined: 'Routine path declined (simulated)',
  care_guidance_final: 'Care guidance finalised (simulated)',
  awaiting_pharmacist_check: 'Awaiting pharmacist check (simulated)',
  pharmacist_flagged: 'Pharmacist flagged for doctor review (simulated)',
  ready_for_checkout: 'Ready for simulated checkout',
  order_placed: 'Order received (simulated)',
  preparing: 'Preparing (simulated)',
  dispatched: 'Dispatched (simulated)',
  out_for_delivery: 'Out for delivery (simulated)',
  delivered: 'Delivered (simulated)',
};
