import { FileText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { selectEpisodeRecord, selectRecords } from '../../app/selectors';
import { useAppState } from '../../app/store';
import { CONCERN_LABELS, DELIVERY_STATUS_LABELS, DURATION_LABELS, PATIENT_DECISION_LABELS, SEVERITY_LABELS, SIMULATED_PRESCRIPTION_NOTICE, WARNING_LABELS } from '../../domain/copy';
import { formatINR } from '../../lib/money';
import { formatDateTime } from '../../lib/time';
import { AuditList, ConsentSummary, DataList, EmptyState, LinkButton, MockBoundaryNote, Notice, PageHeader, ReviewerCard, Section, SimulatedTag, StatusChip } from '../components/ui';

export const RecordsPage = () => {
  const state = useAppState();
  const records = selectRecords(state);
  return (
    <div className="page">
      <PageHeader eyebrow="Records" title="Health records" description="Every demo episode with its reviewer decisions, orders and audit history." meta={<SimulatedTag>Local demo records</SimulatedTag>} />
      {records.length ? (
        <ul className="record-grid">
          {records.map((record) => (
            <li key={record.episodeId} className="card record-card">
              <div className="section__header">
                <h2><Link to={`/patient/records/${record.episodeId}`}>{record.concernLabel}</Link></h2>
                <StatusChip status={record.status} />
              </div>
              <p className="muted">Started <time dateTime={record.createdAt}>{formatDateTime(record.createdAt)}</time> · {record.episodeId}</p>
              <p>{record.outcomeLabel}</p>
              <small>{record.orderStatusLabel ? `Order: ${record.orderStatusLabel} (simulated)` : 'No simulated order'}</small>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No records yet" icon={FileText} headingLevel={2}>No local demo records yet.</EmptyState>
      )}
      <MockBoundaryNote name="ABDM health records" />
    </div>
  );
};

export const RecordDetailPage = () => {
  const { episodeId } = useParams();
  const state = useAppState();
  const record = episodeId ? selectEpisodeRecord(state, episodeId) : null;
  if (!record) return <EmptyState title="Record unavailable" action={<LinkButton to="/patient/records">Back to records</LinkButton>}>Choose a record from the health-record list.</EmptyState>;
  const { episode } = record;
  const reviewer = (id: string | undefined) => record.reviewers.find((candidate) => candidate.id === id) ?? null;
  const intake = episode.intake;
  return (
    <div className="page">
      <PageHeader eyebrow={`Record ${episode.id}`} title="Demo episode record" meta={<StatusChip status={episode.status} />} actions={<LinkButton variant="secondary" to={`/patient/episodes/${episode.id}`}>View timeline</LinkButton>} />
      <div className="grid grid--two">
        <Section title="Consent and intake">
          <ConsentSummary consent={episode.consent} />
          <DataList items={[
            { label: 'Main concern', value: intake.concernArea ? CONCERN_LABELS[intake.concernArea] : 'Not provided' },
            { label: 'Duration', value: intake.duration ? DURATION_LABELS[intake.duration] : 'Not provided' },
            { label: 'Severity', value: intake.severity ? SEVERITY_LABELS[intake.severity] : 'Not provided' },
            { label: 'Warning sign check', value: intake.warningSigns ? WARNING_LABELS[intake.warningSigns] : 'Not provided' },
            { label: 'Additional context', value: intake.freeText || 'None provided' },
          ]} />
        </Section>
        {episode.assessment ? (
          <Section title={<>Preliminary AI summary <SimulatedTag>Simulated</SimulatedTag></>}>
            <p>{episode.assessment.summary}</p>
            <p className="muted">Category: {episode.assessment.category.replaceAll('_', ' ')} · simulated confidence: {episode.assessment.simulatedConfidence}</p>
          </Section>
        ) : <Section title="Preliminary AI summary"><p className="muted">Not created yet.</p></Section>}
      </div>
      <Section title={<>Doctor decisions <SimulatedTag>Demo data</SimulatedTag></>}>
        {episode.decisions.length ? (
          <ol className="audit">
            {episode.decisions.map((decision) => (
              <li key={decision.id} className="audit__item">
                <div className="audit__head"><strong>{PATIENT_DECISION_LABELS[decision.type]}</strong><time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time></div>
                <p>{decision.guidance ?? (decision.note || 'No guidance recorded')}</p>
                <ReviewerCard reviewer={reviewer(decision.reviewerId)} />
              </li>
            ))}
          </ol>
        ) : <p className="muted">No sample doctor decision has been recorded.</p>}
      </Section>
      {episode.prescription && (
        <Section title="Simulated prescription and pharmacist check">
          <Notice tone="urgent" title="Not a valid prescription" headingLevel={3}><p>{SIMULATED_PRESCRIPTION_NOTICE}</p></Notice>
          <ul className="list">{episode.prescription.items.map((item) => <li key={item.label} className="list__row"><span>{item.label}</span><small>{item.instructionsPlaceholder}</small></li>)}</ul>
          <ReviewerCard reviewer={reviewer(episode.prescription.approvedBy)} />
          {episode.pharmacistChecks.length ? (
            <ol className="audit">
              {episode.pharmacistChecks.map((check) => (
                <li key={check.id} className="audit__item">
                  <div className="audit__head"><strong>{check.outcome === 'confirmed' ? 'Medication and fulfillment check confirmed' : 'Flagged to doctor'}</strong><time dateTime={check.checkedAt}>{formatDateTime(check.checkedAt)}</time></div>
                  <p>{check.reason || 'No flag reason recorded'} <SimulatedTag>Simulated check</SimulatedTag></p>
                  <ReviewerCard reviewer={reviewer(check.reviewerId)} />
                </li>
              ))}
            </ol>
          ) : <p className="muted">Awaiting simulated pharmacist check.</p>}
        </Section>
      )}
      {episode.order && (
        <Section title="Simulated order and delivery" actions={<Link to={`/patient/orders/${episode.order.id}`}>Open order page</Link>}>
          <ul className="list">{episode.order.lines.map((line) => <li key={line.label} className="list__row"><span>{line.label}</span><span>{formatINR(line.amountPaise)} (demo price)</span></li>)}</ul>
          <DataList items={[
            { label: 'Fictional order ID', value: episode.order.id },
            { label: 'Partners', value: `${episode.order.pharmacyPartner} · ${episode.order.deliveryPartner}` },
            { label: 'Total', value: `${formatINR(episode.order.totalPaise)} (demo price)` },
            { label: 'Payment method', value: `${episode.order.paymentMethod.toUpperCase()} (simulated payment)` },
            { label: 'Delivery estimate', value: episode.order.deliveryEstimate },
          ]} />
          {episode.tracking && (
            <ol className="audit">
              {episode.tracking.events.map((event) => (
                <li key={`${event.status}-${event.at}`} className="audit__item">
                  <div className="audit__head"><strong>{DELIVERY_STATUS_LABELS[event.status]}</strong><time dateTime={event.at}>{formatDateTime(event.at)}</time></div>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}
      <AuditList audit={record.audit} />
    </div>
  );
};
