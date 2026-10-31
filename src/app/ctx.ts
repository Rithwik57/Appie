import { mockAssessment } from '../integrations/mockAssessment';
import { mockDelivery } from '../integrations/mockDelivery';
import { mockPayment } from '../integrations/mockPayment';
import { mockPharmacy } from '../integrations/mockPharmacy';
import type { AssessmentService, DeliveryService, PaymentService, PharmacyService } from '../integrations/types';

export interface Services { assessment: AssessmentService; payment: PaymentService; pharmacy: PharmacyService; delivery: DeliveryService; }
export interface Ctx { now: () => string; services: Services; }
export const defaultCtx: Ctx = { now: () => new Date().toISOString(), services: { assessment: mockAssessment, payment: mockPayment, pharmacy: mockPharmacy, delivery: mockDelivery } };
