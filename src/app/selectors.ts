import { ABDM_BOUNDARY } from '../integrations/abdmBoundary';
import { LABS_BOUNDARY } from '../integrations/labsBoundary';
import { mockDelivery, DELIVERY_BOUNDARY } from '../integrations/mockDelivery';
import { mockPayment, PAYMENT_BOUNDARY } from '../integrations/mockPayment';
import { mockPharmacy, PHARMACY_BOUNDARY } from '../integrations/mockPharmacy';
import { mockRecords, RECORDS_BOUNDARY } from '../integrations/mockRecords';
import { ACTOR_ROLE_LABELS, AUDIT_ACTION_LABELS } from '../domain/copy';
import { isFulfillmentEligible } from '../domain/predicates';
import type { AppState, AuditEntry, DeliveryStatus, DemoIdentity, Episode, Order, Role } from '../domain/types';
import { DEMO_SEED } from '../seed';
export { hasOpenTeleconsult, isFulfillmentEligible, isRoutineBlocked, lastDecision } from '../domain/predicates';

const DONE_STATUSES = ['consent_declined', 'declined', 'care_guidance_final', 'delivered'];

export const selectCheckoutQuote = () => mockPharmacy.quote();
export const selectRecords = (state: AppState) => mockRecords.listEpisodes(state);
export const selectEpisodeRecord = (state: AppState, id: string) => mockRecords.getEpisodeRecord(state, id);
export const selectEpisode = (state: AppState, id: string) => state.episodes.find((episode) => episode.id === id) ?? null;
export const selectAuditFor = (state: AppState, id: string) => state.audit.filter((entry) => entry.episodeId === id);
export const selectReviewer = (state: AppState, id: string | null) => state.reviewers.find((reviewer) => reviewer.id === id) ?? null;
export const deliveryLabel = (status: DeliveryStatus) => mockDelivery.label(status);
export const nextDeliveryStatus = (status: DeliveryStatus) => mockDelivery.next(status);
export const DELIVERY_SEQUENCE = mockDelivery.sequence;
export const BOUNDARIES = { payment: PAYMENT_BOUNDARY, pharmacy: PHARMACY_BOUNDARY, delivery: DELIVERY_BOUNDARY, records: RECORDS_BOUNDARY, abdm: ABDM_BOUNDARY, labs: LABS_BOUNDARY } as const;
export const selectActiveEpisodes = (state: AppState) => state.episodes.filter((episode) => !DONE_STATUSES.includes(episode.status));
export const selectCurrentEpisode = (state: AppState) => [...selectActiveEpisodes(state)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null;
export const selectRecentDoneEpisodes = (state: AppState) => state.episodes.filter((episode) => DONE_STATUSES.includes(episode.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

/** Resolves an order ID to the one episode that owns it (orders are never copied). */
export const selectEpisodeByOrderId = (state: AppState, orderId: string): Episode | null =>
  state.episodes.find((episode) => episode.order?.id === orderId) ?? null;

export const selectOrders = (state: AppState): { episode: Episode; order: Order }[] =>
  state.episodes.flatMap((episode) => (episode.order === null ? [] : [{ episode, order: episode.order }]));

/** Orders the patient can follow that are not yet delivered. */
export const selectActiveOrders = (state: AppState) =>
  selectOrders(state).filter(({ episode }) => isFulfillmentEligible(episode) && episode.tracking?.current !== 'delivered');

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  patient: DEMO_SEED.users.patient.roleDescription,
  doctor: DEMO_SEED.users.doctor.roleDescription,
  pharmacist: DEMO_SEED.users.pharmacist.roleDescription,
  ops: DEMO_SEED.users.ops.roleDescription,
};

/** The one seeded demo identity for each role. */
export const selectDemoIdentity = (state: AppState, role: Role): DemoIdentity => {
  if (role === 'patient') return { id: state.patient.id, role, displayName: state.patient.displayName, detail: 'Fictional demo patient' };
  if (role === 'ops') return { id: state.operator.id, role, displayName: state.operator.displayName, detail: state.operator.teamLabel };
  const reviewer = state.reviewers.find((candidate) => candidate.role === role);
  return { id: reviewer?.id ?? `${role}-missing`, role, displayName: reviewer?.displayName ?? 'Sample reviewer', detail: reviewer?.credentialLabel ?? 'Sample identity' };
};

export const describeAudit = (entry: AuditEntry) => ({
  actionLabel: AUDIT_ACTION_LABELS[entry.action],
  roleLabel: ACTOR_ROLE_LABELS[entry.actorRole],
});

/** Fulfillment-only audit entries an operations user may see. */
export const selectFulfillmentAudit = (state: AppState, episodeId: string) =>
  selectAuditFor(state, episodeId).filter((entry) => ['payment_simulated', 'order_created', 'delivery_status_changed'].includes(entry.action));

void mockPayment;
