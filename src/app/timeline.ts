import { mockDelivery } from '../integrations/mockDelivery';
import type { AuditEntry, Episode, TimelineStep, TimelineStepKey, TimelineStepState } from '../domain/types';

const keys: readonly TimelineStepKey[] = ['intake', 'assessment', 'doctor', 'prescription', 'pharmacist', 'payment', 'fulfillment', 'delivery', 'followup'];
const labels: Record<TimelineStepKey, string> = { intake: 'Symptom intake', assessment: 'Preliminary assessment (simulated)', doctor: 'Doctor review', prescription: 'Simulated prescription', pharmacist: 'Pharmacist check', payment: 'Payment (simulated)', fulfillment: 'Order preparation', delivery: 'Delivery', followup: 'Follow-up' };
const parties: Record<TimelineStepKey, string> = { intake: 'Patient', assessment: 'Mock assessment service', doctor: 'Sample doctor', prescription: 'Sample doctor', pharmacist: 'Sample pharmacist', payment: 'Demo payment provider', fulfillment: 'Fulfillment operations (demo)', delivery: 'Fulfillment operations (demo)', followup: 'Patient' };
const stateRows: Record<Episode['status'], readonly TimelineStepState[]> = {
  consent_pending: ['active','pending','pending','pending','pending','pending','pending','pending','pending'], intake_in_progress: ['active','pending','pending','pending','pending','pending','pending','pending','pending'],
  consent_declined: ['skipped','skipped','skipped','skipped','skipped','skipped','skipped','skipped','active'],
  awaiting_doctor_review: ['completed','completed','active','pending','pending','pending','pending','pending','pending'], in_doctor_review: ['completed','completed','active','pending','pending','pending','pending','pending','pending'], more_info_requested: ['completed','completed','active','pending','pending','pending','pending','pending','pending'], teleconsult_requested: ['completed','completed','active','pending','pending','pending','pending','pending','pending'],
  escalated_urgent: ['completed','completed','blocked','blocked','blocked','blocked','blocked','blocked','active'], declined: ['completed','completed','completed','skipped','skipped','skipped','skipped','skipped','active'], care_guidance_final: ['completed','completed','completed','skipped','skipped','skipped','skipped','skipped','active'],
  awaiting_pharmacist_check: ['completed','completed','completed','completed','active','pending','pending','pending','pending'], pharmacist_flagged: ['completed','completed','active','completed','blocked','pending','pending','pending','pending'], ready_for_checkout: ['completed','completed','completed','completed','completed','active','pending','pending','pending'],
  order_placed: ['completed','completed','completed','completed','completed','completed','active','pending','pending'], preparing: ['completed','completed','completed','completed','completed','completed','active','pending','pending'], dispatched: ['completed','completed','completed','completed','completed','completed','active','pending','pending'], out_for_delivery: ['completed','completed','completed','completed','completed','completed','completed','active','pending'], delivered: ['completed','completed','completed','completed','completed','completed','completed','completed','active'],
};
const timestampFor = (key: TimelineStepKey, episode: Episode, audit: readonly AuditEntry[]) => {
  const action: Partial<Record<TimelineStepKey, AuditEntry['action']>> = { intake: 'intake_submitted', assessment: 'ai_summary_created', doctor: 'review_started', pharmacist: 'pharmacist_confirmed', payment: 'payment_simulated', fulfillment: 'order_created', delivery: 'delivery_status_changed' };
  const match = action[key] === undefined ? undefined : audit.filter((entry) => entry.action === action[key]).at(-1);
  return match?.at ?? (key === 'intake' ? episode.intake.submittedAt ?? undefined : undefined);
};
export const deriveTimeline = (episode: Episode, audit: readonly AuditEntry[]): TimelineStep[] => keys.map((key, index) => {
  const state = stateRows[episode.status][index]!;
  let detail: string | undefined;
  if (episode.status === 'escalated_urgent' && state === 'blocked') detail = 'Paused: routine flow stopped';
  if (episode.status === 'consent_declined' && state === 'skipped') detail = 'No information collected';
  if (['care_guidance_final', 'declined'].includes(episode.status) && state === 'skipped') detail = episode.status === 'declined' ? 'Not continued' : 'Not needed';
  if (episode.status === 'more_info_requested' && key === 'doctor') detail = 'Waiting for your reply';
  if (episode.status === 'teleconsult_requested' && key === 'doctor') detail = 'Teleconsultation requested';
  if (episode.status === 'pharmacist_flagged' && key === 'doctor') detail = 'Re-review after pharmacist flag';
  if (episode.status === 'pharmacist_flagged' && key === 'pharmacist') detail = 'Flagged';
  if (key === 'fulfillment' && episode.tracking !== null) detail = `Current progress: ${mockDelivery.label(episode.tracking.current)} (simulated)`;
  if (key === 'delivery' && episode.tracking !== null) detail = `Current status: ${mockDelivery.label(episode.tracking.current)} (simulated)`;
  if (key === 'followup' && state === 'active') detail = 'Contact human help any time if things change';
  const events = key === 'delivery' && episode.tracking !== null
    ? episode.tracking.events.map((event) => ({ at: event.at, detail: `${mockDelivery.label(event.status)} (simulated)` }))
    : undefined;
  return { key, label: labels[key], state, party: parties[key], detail, at: timestampFor(key, episode, audit), events };
});
