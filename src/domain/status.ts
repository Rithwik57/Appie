import type { Tone } from './types';

export const EPISODE_STATUSES = [
  'consent_pending', 'consent_declined', 'intake_in_progress',
  'awaiting_doctor_review', 'in_doctor_review', 'more_info_requested', 'teleconsult_requested',
  'escalated_urgent', 'declined', 'care_guidance_final',
  'awaiting_pharmacist_check', 'pharmacist_flagged', 'ready_for_checkout',
  'order_placed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered',
] as const;

export type EpisodeStatus = typeof EPISODE_STATUSES[number];

export const ROUTINE_FULFILLMENT_STATUSES: ReadonlySet<EpisodeStatus> = new Set([
  'awaiting_pharmacist_check', 'ready_for_checkout', 'order_placed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered',
]);

export const DELIVERY_STATUSES = ['order_placed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered'] as const;

interface StatusMeta { label: string; tone: Tone; patientSummary: string; }

export const STATUS_META: Record<EpisodeStatus, StatusMeta> = {
  consent_pending: { label: 'Consent needed', tone: 'neutral', patientSummary: 'Review the demo privacy information before sharing answers.' },
  consent_declined: { label: 'Consent declined', tone: 'neutral', patientSummary: 'No information was collected.' },
  intake_in_progress: { label: 'Intake in progress', tone: 'info', patientSummary: 'Continue your health check when ready.' },
  awaiting_doctor_review: { label: 'Awaiting doctor review', tone: 'info', patientSummary: 'A sample doctor will review the simulated summary.' },
  in_doctor_review: { label: 'Doctor review in progress', tone: 'info', patientSummary: 'A sample doctor is reviewing this demo episode.' },
  more_info_requested: { label: 'More information requested', tone: 'warning', patientSummary: 'A sample doctor needs more information.' },
  teleconsult_requested: { label: 'Teleconsultation requested', tone: 'warning', patientSummary: 'This simulated request is awaiting human follow-up.' },
  escalated_urgent: { label: 'Routine Appie flow paused', tone: 'urgent', patientSummary: 'Seek immediate in-person care or contact local emergency services.' },
  declined: { label: 'Routine path declined', tone: 'warning', patientSummary: 'Explore human help or in-person care options.' },
  care_guidance_final: { label: 'Care guidance finalised', tone: 'success', patientSummary: 'A sample doctor finalised simulated guidance.' },
  awaiting_pharmacist_check: { label: 'Awaiting pharmacist check', tone: 'info', patientSummary: 'A sample pharmacist will check fulfillment details.' },
  pharmacist_flagged: { label: 'Pharmacist flagged for doctor review', tone: 'warning', patientSummary: 'A sample doctor is re-reviewing the episode.' },
  ready_for_checkout: { label: 'Ready for simulated checkout', tone: 'success', patientSummary: 'Both sample reviewers have completed their checks.' },
  order_placed: { label: 'Order received', tone: 'success', patientSummary: 'The sample pharmacy partner has received your simulated order.' },
  preparing: { label: 'Preparing', tone: 'info', patientSummary: 'The simulated order is being prepared.' },
  dispatched: { label: 'Dispatched', tone: 'info', patientSummary: 'The simulated order has been handed to the sample delivery partner.' },
  out_for_delivery: { label: 'Out for delivery', tone: 'info', patientSummary: 'The simulated delivery is on its way.' },
  delivered: { label: 'Delivered', tone: 'success', patientSummary: 'The simulated delivery is complete.' },
};
