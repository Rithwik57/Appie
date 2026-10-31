import type { BoundaryInfo, PharmacyService } from './types';
import { DEMO_SEED } from '../seed';
const services = DEMO_SEED.services;
const lines = () => services.orderLines.map((line) => ({ ...line }));
export const PHARMACY_BOUNDARY: BoundaryInfo = { name: services.pharmacyPartner, status: 'mock', note: 'Local mock pharmacy boundary – not connected' };
export const mockPharmacy: PharmacyService = {
  quote: () => ({ lines: lines(), totalPaise: services.totalPaise, deliveryEstimate: services.deliveryEstimate, pharmacyPartner: services.pharmacyPartner, deliveryPartner: services.deliveryPartner }),
  createOrder: (input, clock) => ({ id: input.orderId, pharmacyPartner: services.pharmacyPartner, deliveryPartner: services.deliveryPartner, lines: lines(), totalPaise: services.totalPaise, paymentMethod: input.method, paymentRef: input.paymentRef, deliveryEstimate: services.deliveryEstimate, placedAt: clock.now() }),
};
