import type { AppState, Assessment, DeliveryStatus, DemoPatient, EpisodeRecord, Order, OrderLine, PaymentMethod, RecordSummary, SymptomIntake } from '../domain/types';

export type Clock = { now: () => string };
export type AssessmentService = (intake: SymptomIntake, clock: Clock) => Omit<Assessment, 'id'>;
export interface PaymentService { pay(input: { amountPaise: number; method: PaymentMethod; episodeId: string; paymentRef: string }, clock: Clock): { ok: true; paymentRef: string } | { ok: false; reason: string }; }
export interface PharmacyService { createOrder(input: { orderId: string; method: PaymentMethod; paymentRef: string; address: DemoPatient['address'] }, clock: Clock): Order; quote(): { lines: OrderLine[]; totalPaise: number; deliveryEstimate: string; pharmacyPartner: string; deliveryPartner: string }; }
export interface DeliveryService { readonly sequence: readonly DeliveryStatus[]; next(current: DeliveryStatus): DeliveryStatus | null; label(status: DeliveryStatus): string; }
export interface BoundaryInfo { name: string; status: 'mock' | 'not_connected'; note: string; }
export interface RecordsService { listEpisodes(state: AppState): RecordSummary[]; getEpisodeRecord(state: AppState, id: string): EpisodeRecord | null; }
export interface AbdmBoundary { readonly status: 'not_connected'; }
export interface LabsBoundary { readonly status: 'not_connected'; }
