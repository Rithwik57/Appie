import { DELIVERY_STATUS_LABELS } from '../domain/copy';
import type { BoundaryInfo, DeliveryService } from './types';
import { DEMO_SEED } from '../seed';
export const DELIVERY_SEQUENCE = ['order_placed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered'] as const;
export const DELIVERY_BOUNDARY: BoundaryInfo = { name: DEMO_SEED.services.deliveryPartner, status: 'mock', note: 'Local mock delivery boundary – not connected' };
export const mockDelivery: DeliveryService = { sequence: DELIVERY_SEQUENCE, next: (current) => DELIVERY_SEQUENCE[DELIVERY_SEQUENCE.indexOf(current) + 1] ?? null, label: (status) => DELIVERY_STATUS_LABELS[status] };
