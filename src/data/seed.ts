import { DELIVERY_STATUS_LABELS, REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import type {
  AppState,
  Assessment,
  AuditAction,
  AuditEntry,
  Consent,
  DeliveryTracking,
  DemoSeedScenario,
  Episode,
  PharmacistCheck,
  Prescription,
  ReviewDecision,
} from '../domain/types';
import { nextId } from '../lib/ids';
import { DEMO_SEED } from '../seed';

const BASE = '2025-01-15T09:00:00+05:30';

const acceptedConsent = (decidedAt: string): Consent => ({
  decision: 'accepted',
  decidedAt,
  policyVersion: 'demo-privacy-v1',
  purposes: ['assessment', 'clinician_review', 'pharmacy_fulfillment', 'records'],
});

const summaryFor = (category: Assessment['category']): string =>
  category === 'possibly_urgent'
    ? 'Your answers may need urgent in-person attention. The routine prototype flow is paused.'
    : category === 'needs_human_input'
      ? 'Your answers need more human input before any simulated care guidance is considered.'
      : 'Your answers describe a concern that may be suitable for routine remote care. A doctor will review this before any care plan is given.';

const scenario = (kind: DemoSeedScenario['kind']): DemoSeedScenario => {
  const found = DEMO_SEED.scenarios.find((candidate) => candidate.kind === kind);
  if (found === undefined) throw new Error(`[appie] demo seed is missing the ${kind} scenario.`);
  return found;
};

/** Builds a fresh, deterministic copy of the seeded demo state from the JSON seed. */
export const buildSeedState = (): AppState => {
  const { users, services, catalog } = DEMO_SEED;
  const { roleDescription: _patientDescription, ...patientUser } = users.patient;
  const { roleDescription: _doctorDescription, ...doctor } = users.doctor;
  const { roleDescription: _pharmacistDescription, ...pharmacist } = users.pharmacist;
  const { roleDescription: _opsDescription, ...operator } = users.ops;
  void _patientDescription;
  void _doctorDescription;
  void _pharmacistDescription;
  void _opsDescription;

  let counters: Record<string, number> = {};
  const issue = (prefix: string): string => {
    const issued = nextId(counters, prefix);
    counters = issued.counters;
    return issued.id;
  };

  const routine = scenario('routine');
  const urgent = scenario('urgent');
  const unclear = scenario('unclear');
  const historic = scenario('historical');
  const ordered = [routine, urgent, unclear, historic];

  const assessments = ordered.map((item): Assessment => ({
    id: issue('asm'),
    category: item.assessment.category,
    simulatedConfidence: item.assessment.simulatedConfidence,
    summary: summaryFor(item.assessment.category),
    suggestedGuidance: REVIEWER_APPROVED_GUIDANCE,
    createdAt: item.createdAt,
    source: 'mock-assessment-v1',
    isSimulated: true,
  }));

  const history = services.historicalOrder;
  const reviewedAt = history.reviewedAt;
  const historicDecision: ReviewDecision = {
    id: issue('dec'),
    reviewerId: doctor.id,
    type: 'approve_with_prescription',
    guidance: REVIEWER_APPROVED_GUIDANCE,
    guidanceEdited: false,
    note: 'Sample review completed for the historical demo episode.',
    decidedAt: reviewedAt,
  };
  const historicPrescription: Prescription = {
    id: issue('SIM-RX'),
    version: 1,
    items: catalog.items.map((item) => ({ ...item })),
    approvedBy: doctor.id,
    approvedAt: reviewedAt,
    status: 'checked',
    validity: 'NOT_VALID_DEMO_ONLY',
  };
  const historicCheck: PharmacistCheck = {
    id: issue('chk'),
    reviewerId: pharmacist.id,
    prescriptionVersion: 1,
    outcome: 'confirmed',
    reason: '',
    checkedAt: reviewedAt,
  };
  const tracking: DeliveryTracking = {
    current: history.deliveryEvents.at(-1)!.status,
    events: history.deliveryEvents.map((event) => ({ ...event })),
  };
  const placedAt = history.deliveryEvents[0]!.at;

  const base = (item: DemoSeedScenario, index: number): Episode => ({
    id: item.episodeId,
    patientId: patientUser.id,
    status: 'awaiting_doctor_review',
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    seedScenario: item.kind,
    consent: acceptedConsent(item.createdAt),
    intake: { subject: 'self', ...item.intake, submittedAt: item.createdAt },
    assessment: assessments[index]!,
    decisions: [],
    prescription: null,
    pharmacistChecks: [],
    order: null,
    tracking: null,
    moreInfo: [],
    helpRequests: [],
    escalatedAt: null,
    activeReviewerId: null,
  });

  const episodes: Episode[] = [
    base(routine, 0),
    { ...base(urgent, 1), status: 'escalated_urgent', escalatedAt: urgent.createdAt },
    base(unclear, 2),
    {
      ...base(historic, 3),
      status: 'delivered',
      updatedAt: tracking.events.at(-1)!.at,
      decisions: [historicDecision],
      prescription: historicPrescription,
      pharmacistChecks: [historicCheck],
      order: {
        id: issue('SIM-ORD'),
        pharmacyPartner: services.pharmacyPartner,
        deliveryPartner: services.deliveryPartner,
        lines: services.orderLines.map((line) => ({ ...line })),
        totalPaise: services.totalPaise,
        paymentMethod: history.paymentMethod,
        paymentRef: issue('SIM-PAY'),
        deliveryEstimate: services.deliveryEstimate,
        placedAt,
      },
      tracking,
    },
  ];

  const audit: AuditEntry[] = [];
  const addAudit = (episodeId: string, at: string, action: AuditAction, actorRole: AuditEntry['actorRole'], actorName: string, detail: string): void => {
    audit.push({ id: issue('aud'), episodeId, at, action, actorRole, actorName, detail });
  };
  for (const episode of episodes) {
    addAudit(episode.id, episode.createdAt, 'consent_accepted', 'patient', patientUser.displayName, 'Demo consent recorded.');
    addAudit(episode.id, episode.createdAt, 'intake_submitted', 'patient', patientUser.displayName, 'Demo intake submitted.');
    addAudit(episode.id, episode.createdAt, 'ai_summary_created', 'system', 'Mock assessment service', 'AI summary created (simulated).');
  }
  addAudit(urgent.episodeId, urgent.createdAt, 'patient_escalated', 'patient', patientUser.displayName, 'Routine flow paused for the urgent demo scenario.');
  addAudit(historic.episodeId, reviewedAt, 'approve_with_prescription', 'doctor', doctor.displayName, 'Sample doctor approved the simulated historical review.');
  addAudit(historic.episodeId, reviewedAt, 'pharmacist_confirmed', 'pharmacist', pharmacist.displayName, 'Sample pharmacist confirmed the demonstration check.');
  addAudit(historic.episodeId, placedAt, 'payment_simulated', 'patient', patientUser.displayName, 'Simulated payment completed.');
  addAudit(historic.episodeId, placedAt, 'order_created', 'system', services.pharmacyPartner, 'Simulated order received by the sample pharmacy partner.');
  for (const event of tracking.events.slice(1)) {
    addAudit(historic.episodeId, event.at, 'delivery_status_changed', 'ops', operator.displayName, `Fulfillment status updated to ${DELIVERY_STATUS_LABELS[event.status]} (simulated).`);
  }

  return {
    schemaVersion: 2,
    role: null,
    patient: { ...patientUser, address: { ...patientUser.address } },
    reviewers: [{ ...doctor }, { ...pharmacist }],
    operator: { ...operator },
    episodes,
    audit,
    idCounters: counters,
  };
};

export const SEED_BASE_TIME = BASE;
