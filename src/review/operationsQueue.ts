import { DELIVERY_STATUS_LABELS } from '../domain/copy';
import { isFulfillmentEligible } from '../domain/predicates';
import { DELIVERY_STATUSES } from '../domain/status';
import type { AppState, DeliveryStatus, DeliveryTracking, Episode, Order } from '../domain/types';

export type OperationsQueueTab = 'active' | 'delivered';
export interface OperationsQueueItem {
  episode: Episode;
  order: Order;
  tracking: DeliveryTracking;
  statusLabel: string;
  nextStatus: DeliveryStatus | null;
}

export const nextFulfillmentStatus = (current: DeliveryStatus): DeliveryStatus | null =>
  DELIVERY_STATUSES[DELIVERY_STATUSES.indexOf(current) + 1] ?? null;

/** Only orders that passed doctor approval, pharmacist confirmation and simulated payment. */
export const selectOperationsQueue = (state: AppState, tab: OperationsQueueTab): OperationsQueueItem[] =>
  state.episodes
    .filter(isFulfillmentEligible)
    .map((episode) => ({ episode, order: episode.order!, tracking: episode.tracking! }))
    .filter(({ tracking }) => (tab === 'delivered' ? tracking.current === 'delivered' : tracking.current !== 'delivered'))
    .sort((a, b) => (tab === 'active' ? a.order.placedAt.localeCompare(b.order.placedAt) : b.episode.updatedAt.localeCompare(a.episode.updatedAt)))
    .map((item) => ({ ...item, statusLabel: DELIVERY_STATUS_LABELS[item.tracking.current], nextStatus: nextFulfillmentStatus(item.tracking.current) }));
