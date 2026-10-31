import type { EpisodeStatus } from './status';

export type Role = 'patient' | 'doctor' | 'pharmacist' | 'ops';

export interface ReviewerIdentity {
  id: string;
  role: 'doctor' | 'pharmacist';
  displayName: string;
  credentialLabel: string;
  isSample: true;
}

export interface DemoPatient {
  id: 'pat-demo-01';
  displayName: string;
  ageBand: '25–34';
  address: { line1: string; area: string; city: string; pin: string; isFictional: true };
}

export type ConsentDecision = 'accepted' | 'declined';
export interface Consent {
  decision: ConsentDecision;
  decidedAt: string;
  policyVersion: 'demo-privacy-v1';
  purposes: ReadonlyArray<'assessment' | 'clinician_review' | 'pharmacy_fulfillment' | 'records'>;
}

export type ConcernArea = 'cold_cough_throat' | 'stomach_upset' | 'skin_irritation' | 'aches_pains' | 'something_else';
export type Duration = 'under_1_day' | '1_3_days' | '4_7_days' | 'over_1_week';
export type Severity = 'mild' | 'moderate' | 'severe';
export type WarningSignAnswer = 'no' | 'not_sure' | 'yes';

export interface SymptomIntake {
  subject: 'self';
  concernArea: ConcernArea | null;
  duration: Duration | null;
  severity: Severity | null;
  warningSigns: WarningSignAnswer | null;
  freeText: string;
  submittedAt: string | null;
}

export type AssessmentCategory = 'looks_routine' | 'needs_human_input' | 'possibly_urgent';
export interface Assessment {
  id: string;
  category: AssessmentCategory;
  simulatedConfidence: 'low' | 'medium' | 'high';
  summary: string;
  suggestedGuidance: string;
  createdAt: string;
  source: 'mock-assessment-v1';
  isSimulated: true;
}

export type DoctorDecisionType =
  | 'approve_with_prescription'
  | 'finalize_without_prescription'
  | 'decline_routine'
  | 'request_more_info'
  | 'escalate_urgent'
  | 'route_teleconsult';

export interface ReviewDecision {
  id: string;
  reviewerId: string;
  type: DoctorDecisionType;
  guidance: string | null;
  guidanceEdited: boolean;
  note: string;
  decidedAt: string;
}

export interface PrescriptionItem {
  label: string;
  instructionsPlaceholder: 'As directed in the reviewer-approved care plan (simulated)';
}
export interface Prescription {
  id: string;
  version: number;
  items: PrescriptionItem[];
  approvedBy: string;
  approvedAt: string;
  status: 'awaiting_check' | 'checked' | 'flagged';
  validity: 'NOT_VALID_DEMO_ONLY';
}

export interface PharmacistCheck {
  id: string;
  reviewerId: string;
  prescriptionVersion: number;
  outcome: 'confirmed' | 'flagged_to_doctor';
  reason: string;
  checkedAt: string;
}

export type PaymentMethod = 'upi' | 'card' | 'wallet';
export interface OrderLine { label: string; amountPaise: number; }
export interface Order {
  id: string;
  pharmacyPartner: string;
  deliveryPartner: string;
  lines: OrderLine[];
  totalPaise: number;
  paymentMethod: PaymentMethod;
  paymentRef: string;
  deliveryEstimate: string;
  placedAt: string;
}

export type DeliveryStatus = 'order_placed' | 'preparing' | 'dispatched' | 'out_for_delivery' | 'delivered';
export interface DeliveryEvent { status: DeliveryStatus; at: string; }
export interface DeliveryTracking { current: DeliveryStatus; events: DeliveryEvent[]; }

export interface MoreInfoExchange { question: string; askedAt: string; response: string | null; respondedAt: string | null; }
export interface HumanHelpRequest {
  kind: 'teleconsult';
  requestedBy: 'patient' | 'doctor';
  note: string;
  at: string;
  madeWhileEscalated: boolean;
}

export type Tone = 'info' | 'success' | 'warning' | 'urgent' | 'neutral' | 'blocked';
export type TimelineStepKey = 'intake' | 'assessment' | 'doctor' | 'prescription' | 'pharmacist' | 'payment' | 'fulfillment' | 'delivery' | 'followup';
export type TimelineStepState = 'completed' | 'active' | 'pending' | 'blocked' | 'skipped';
export interface TimelineEvent { detail: string; at: string; }
export interface TimelineStep { key: TimelineStepKey; label: string; state: TimelineStepState; party: string; detail?: string; at?: string; events?: readonly TimelineEvent[]; href?: string; }
export interface RecordSummary { episodeId: string; createdAt: string; concernLabel: string; status: EpisodeStatus; outcomeLabel: string; orderStatusLabel: string | null; }
export interface EpisodeRecord { episode: Episode; audit: AuditEntry[]; reviewers: ReviewerIdentity[]; }

export interface AuditEntry {
  id: string;
  episodeId: string;
  at: string;
  actorRole: Role | 'system';
  actorName: string;
  action: AuditAction;
  detail: string;
}
export type AuditAction =
  | 'episode_started' | 'consent_accepted' | 'consent_declined' | 'intake_submitted'
  | 'ai_summary_created' | 'patient_escalated' | 'review_started' | DoctorDecisionType
  | 'more_info_answered' | 'teleconsult_requested' | 'pharmacist_confirmed' | 'pharmacist_flagged'
  | 'payment_simulated' | 'order_created' | 'delivery_status_changed';

export interface Episode {
  id: string;
  patientId: DemoPatient['id'];
  status: EpisodeStatus;
  createdAt: string;
  updatedAt: string;
  seedScenario: 'routine' | 'urgent' | 'unclear' | 'historical' | null;
  consent: Consent | null;
  intake: SymptomIntake;
  assessment: Assessment | null;
  decisions: ReviewDecision[];
  prescription: Prescription | null;
  pharmacistChecks: PharmacistCheck[];
  order: Order | null;
  tracking: DeliveryTracking | null;
  moreInfo: MoreInfoExchange[];
  helpRequests: HumanHelpRequest[];
  escalatedAt: string | null;
  activeReviewerId: string | null;
}

export interface OperationsIdentity {
  id: 'ops-demo-01';
  role: 'ops';
  displayName: string;
  teamLabel: string;
  isSample: true;
}

export interface AppState {
  schemaVersion: 2;
  /** The demo role chosen on the entry page; `null` means no demo role is selected. */
  role: Role | null;
  patient: DemoPatient;
  reviewers: ReviewerIdentity[];
  operator: OperationsIdentity;
  episodes: Episode[];
  audit: AuditEntry[];
  idCounters: Record<string, number>;
}

/** One normalised demo identity per role, used by the entry page and the workspace indicator. */
export interface DemoIdentity {
  id: string;
  role: Role;
  displayName: string;
  detail: string;
}

export type SeedScenarioKind = 'routine' | 'urgent' | 'unclear' | 'historical';
export interface DemoSeedScenario {
  episodeId: string;
  kind: SeedScenarioKind;
  createdAt: string;
  intake: Omit<SymptomIntake, 'subject' | 'submittedAt'>;
  assessment: { category: AssessmentCategory; simulatedConfidence: Assessment['simulatedConfidence'] };
}

export interface DemoSeed {
  users: {
    patient: DemoPatient & { roleDescription: string };
    doctor: ReviewerIdentity & { roleDescription: string };
    pharmacist: ReviewerIdentity & { roleDescription: string };
    ops: OperationsIdentity & { roleDescription: string };
  };
  scenarios: DemoSeedScenario[];
  services: {
    pharmacyPartner: string;
    deliveryPartner: string;
    orderLines: OrderLine[];
    totalPaise: number;
    deliveryEstimate: string;
    historicalOrder: {
      paymentMethod: PaymentMethod;
      reviewedAt: string;
      deliveryEvents: DeliveryEvent[];
    };
  };
  catalog: { items: PrescriptionItem[] };
}
