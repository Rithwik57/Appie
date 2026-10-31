import type { BoundaryInfo, PaymentService } from './types';

export const PAYMENT_BOUNDARY: BoundaryInfo = { name: 'Demo payment provider (simulated)', status: 'mock', note: 'Local mock payment boundary – no real payment' };
export const mockPayment: PaymentService = { pay: (input) => ({ ok: true, paymentRef: input.paymentRef }) };
