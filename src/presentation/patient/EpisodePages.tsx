import { CirclePause, LifeBuoy, Package, ShieldAlert, TriangleAlert } from 'lucide-react';
import { CATEGORY_META } from '../components/categoryMeta';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { selectAuditFor, selectEpisode, selectReviewer } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { deriveTimeline } from '../../app/timeline';
import { EMERGENCY_GUIDANCE, PATIENT_DECISION_LABELS } from '../../domain/copy';
import { STATUS_META } from '../../domain/status';
import type { Episode } from '../../domain/types';
import { formatDateTime } from '../../lib/time';
import { canShowFinalGuidance, canTrack, canViewPrescription } from '../../review/gates';
import { AuditList, BlockedNotice, Button, DeliveryChip, DisclaimerInline, EmptyState, LinkButton, Notice, PageHeader, ReviewerCard, Section, SimulatedTag, StatusChip, TextArea, Timeline, ToneChip } from '../components/ui';
import { useEpisodeFromParams } from './hooks';

const unavailable = (title: string) => <EmptyState title={title} action={<LinkButton to="/patient">Back to dashboard</LinkButton>}>Choose a health check from your dashboard.</EmptyState>;

export const AssessmentPage = () => {
  const episode = useEpisodeFromParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  if (!episode) return unavailable('Assessment unavailable');
  if (episode.status === 'escalated_urgent') return <div className="page"><EmergencyPanel episodeId={episode.id} headingLevel={1} /></div>;
  if (!episode.assessment) return <BlockedNotice title="Assessment not ready">This preliminary assessment is created after intake is submitted.</BlockedNotice>;
  const category = CATEGORY_META[episode.assessment.category];
  const request = () => {
    dispatch({ type: 'REQUEST_TELECONSULT', episodeId: episode.id, note: 'Patient requested human help in the local demo.' });
    navigate(`/patient/episodes/${episode.id}`);
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Step 4 · Preliminary assessment" title="Preliminary AI-assisted assessment" meta={<><SimulatedTag>Simulated</SimulatedTag><StatusChip status={episode.status} /></>} />
      <Section title="Simulated category">
        <p className="category"><category.icon size={22} aria-hidden="true" /><strong>{category.label}</strong> <SimulatedTag>Simulated category</SimulatedTag></p>
        <p>{episode.assessment.summary}</p>
        <Notice tone="info" title="This is not a diagnosis" headingLevel={3}>
          <p>Simulated confidence: {episode.assessment.simulatedConfidence}. This is not a diagnosis or final care recommendation. A doctor must review it.</p>
        </Notice>
        <div className="actions">
          <LinkButton to={`/patient/episodes/${episode.id}`}>View timeline</LinkButton>
          <Button variant="secondary" icon={LifeBuoy} onClick={request}>Request human help</Button>
        </div>
      </Section>
      <DisclaimerInline />
    </div>
  );
};

const PharmacistStatus = ({ episode }: { episode: Episode }) => {
  const state = useAppState();
  const check = episode.pharmacistChecks.at(-1);
  if (episode.prescription === null) return <p className="muted">A pharmacist check is only needed after a doctor approves a simulated care plan.</p>;
  if (episode.status === 'awaiting_pharmacist_check' || check === undefined) return <ToneChip tone="warning">Pending pharmacist check</ToneChip>;
  return (
    <div className="stack stack--tight">
      {check.outcome === 'confirmed' ? <ToneChip tone="success">Pharmacist check confirmed</ToneChip> : <ToneChip tone="warning" icon={TriangleAlert}>Flagged to doctor</ToneChip>}
      <ReviewerCard reviewer={selectReviewer(state, check.reviewerId)} />
      <small>Checked <time dateTime={check.checkedAt}>{formatDateTime(check.checkedAt)}</time></small>
    </div>
  );
};

export const EpisodePage = () => {
  const state = useAppState();
  const episode = useEpisodeFromParams();
  if (!episode) return unavailable('Episode unavailable');
  const decision = episode.decisions.at(-1);
  const audit = selectAuditFor(state, episode.id);
  return (
    <div className="page">
      <PageHeader eyebrow={`Episode ${episode.id}`} title="Your health-check timeline" description={STATUS_META[episode.status].patientSummary} meta={<StatusChip status={episode.status} />} />
      <div className="grid grid--dashboard">
        <div className="grid__main stack">
          {episode.status === 'escalated_urgent' ? <EmergencyPanel episodeId={episode.id} />
            : episode.status === 'more_info_requested' ? <MoreInfoPanel episodeId={episode.id} />
              : episode.status === 'declined' ? <DeclinedPanel episodeId={episode.id} />
                : episode.status === 'teleconsult_requested' ? <TeleconsultPanel episodeId={episode.id} />
                  : canShowFinalGuidance(episode) ? <ReviewerDecisionPanel episodeId={episode.id} />
                    : <NextStepPanel episode={episode} />}
          <Section title="Timeline"><Timeline steps={deriveTimeline(episode, audit)} /></Section>
        </div>
        <aside className="grid__side stack" aria-label="Review and order status">
          <Section title="Doctor decision" level={2}>
            {decision ? (
              <div className="stack stack--tight">
                <p><strong>{PATIENT_DECISION_LABELS[decision.type]}</strong> <SimulatedTag>Simulated</SimulatedTag></p>
                <ReviewerCard reviewer={selectReviewer(state, decision.reviewerId)} />
                <small>Recorded <time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time></small>
              </div>
            ) : <p className="muted">Pending sample doctor review.</p>}
          </Section>
          <Section title="Pharmacist check"><PharmacistStatus episode={episode} /></Section>
          <Section title="Order">
            {episode.order && episode.tracking && canTrack(episode) ? (
              <div className="stack stack--tight">
                <DeliveryChip status={episode.tracking.current} />
                <LinkButton variant="secondary" icon={Package} to={`/patient/orders/${episode.order.id}`}>Track order {episode.order.id}</LinkButton>
              </div>
            ) : episode.status === 'ready_for_checkout' ? (
              <LinkButton to={`/patient/episodes/${episode.id}/checkout`}>Continue to simulated checkout</LinkButton>
            ) : <p className="muted">{episode.escalatedAt !== null ? 'Paused: no routine order for this episode.' : 'No order yet. Orders are created after simulated checkout.'}</p>}
          </Section>
        </aside>
      </div>
      <AuditList audit={audit.slice(-5)} title="Recent audit events" />
      <p><Link to={`/patient/records/${episode.id}`}>View full record and audit history</Link></p>
    </div>
  );
};

const NextStepPanel = ({ episode }: { episode: Episode }) => (
  <Section title="What happens next">
    {episode.status === 'consent_pending' ? <p>Review consent before starting this local demo intake. <Link to={`/patient/episodes/${episode.id}/consent`}>Continue to consent</Link></p>
      : episode.status === 'intake_in_progress' ? <p>Your local demo intake is ready to continue. <Link to={`/patient/episodes/${episode.id}/intake`}>Continue intake</Link></p>
        : episode.assessment !== null && ['awaiting_doctor_review', 'in_doctor_review'].includes(episode.status) ? <p>Review the preliminary simulated assessment while the sample doctor review is pending. <Link to={`/patient/episodes/${episode.id}/assessment`}>View preliminary assessment</Link></p>
          : episode.status === 'pharmacist_flagged' ? <p>The sample pharmacist flagged this item. The sample doctor is re-reviewing it before anything continues.</p>
            : <p>{STATUS_META[episode.status].patientSummary}</p>}
    <p className="cluster"><Link to={`/patient/episodes/${episode.id}/teleconsult`}>Get human help</Link><Link to={`/patient/records/${episode.id}`}>View record</Link></p>
  </Section>
);

export const ReviewerDecisionPanel = ({ episodeId }: { episodeId: string }) => {
  const state = useAppState();
  const episode = selectEpisode(state, episodeId);
  if (!episode || !canShowFinalGuidance(episode)) return null;
  const decision = episode.decisions.at(-1);
  const reviewer = selectReviewer(state, decision?.reviewerId ?? null);
  return (
    <Section title={<>Doctor review completed <SimulatedTag>Demo decision</SimulatedTag></>}>
      <ReviewerCard reviewer={reviewer} />
      <p><strong>Decision:</strong> {decision ? PATIENT_DECISION_LABELS[decision.type] : 'Doctor decision recorded'} <SimulatedTag>Simulated</SimulatedTag></p>
      {decision && <p><strong>Recorded:</strong> <time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time></p>}
      <p className="quote">{decision?.guidance ?? 'No final simulated care guidance was recorded.'}</p>
      <div className="actions">
        {canViewPrescription(episode) ? <LinkButton to={`/patient/episodes/${episode.id}/prescription`}>View simulated prescription and order</LinkButton> : <LinkButton to={`/patient/records/${episode.id}`}>View complete record</LinkButton>}
        {canTrack(episode) && episode.order && <LinkButton variant="secondary" to={`/patient/orders/${episode.order.id}`}>Track simulated delivery</LinkButton>}
      </div>
    </Section>
  );
};

export const EmergencyPanel = ({ episodeId, headingLevel = 2 }: { episodeId: string; headingLevel?: 1 | 2 }) => {
  const episode = selectEpisode(useAppState(), episodeId);
  const teleconsultRequested = episode?.helpRequests.some((request) => request.kind === 'teleconsult') ?? false;
  return (
    <div className="card card--urgent">
      <Notice tone="urgent" icon={CirclePause} title="Routine Appie flow paused" headingLevel={headingLevel}>
        <p>This demo episode may need urgent attention. {EMERGENCY_GUIDANCE}</p>
        <p className="muted">The routine path, and every step after it, is paused for this episode.</p>
      </Notice>
      {teleconsultRequested && <Notice tone="info" title="Teleconsultation request recorded" headingLevel={3}><p>Simulated request recorded. This local demo does not schedule care.</p></Notice>}
      <div className="actions">
        <LinkButton to={`/patient/episodes/${episodeId}/in-person-care`} icon={ShieldAlert}>Find in-person care</LinkButton>
        {!teleconsultRequested && <LinkButton variant="secondary" to={`/patient/episodes/${episodeId}/teleconsult`}>Request human teleconsultation</LinkButton>}
      </div>
    </div>
  );
};

export const MoreInfoPanel = ({ episodeId }: { episodeId: string }) => {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const episode = selectEpisode(state, episodeId)!;
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const question = episode.moreInfo.at(-1)?.question ?? 'Please share more context for the sample doctor.';
  const submit = () => {
    const result = dispatch({ type: 'ANSWER_MORE_INFO', episodeId, response });
    if (result.ok) navigate(`/patient/episodes/${episodeId}`);
    else setError(result.error.fieldErrors?.response ?? result.error.message);
  };
  return (
    <Section title={<>More information requested <SimulatedTag>Demo doctor question</SimulatedTag></>} className="card--warning">
      <p className="quote">{question}</p>
      <TextArea label="Your response" value={response} onChange={(value) => { setResponse(value); setError(null); }} error={error ?? undefined} required />
      <div className="actions">
        <Button onClick={submit}>Send response to sample doctor</Button>
        <LinkButton variant="ghost" to={`/patient/episodes/${episodeId}/teleconsult`}>Request teleconsultation</LinkButton>
        <LinkButton variant="ghost" to={`/patient/episodes/${episodeId}/in-person-care`}>In-person care</LinkButton>
      </div>
    </Section>
  );
};

export const DeclinedPanel = ({ episodeId }: { episodeId: string }) => {
  const episode = selectEpisode(useAppState(), episodeId)!;
  const decision = episode.decisions.at(-1);
  return (
    <Section title={<>Routine path declined <SimulatedTag>Demo decision</SimulatedTag></>}>
      <p>{decision?.note || 'The sample doctor did not continue this routine demo path.'}</p>
      <div className="actions">
        <LinkButton to={`/patient/episodes/${episodeId}/teleconsult`}>Request teleconsultation</LinkButton>
        <LinkButton variant="secondary" to={`/patient/episodes/${episodeId}/in-person-care`}>Explore in-person care</LinkButton>
        <LinkButton variant="ghost" to="/patient">Dashboard</LinkButton>
      </div>
    </Section>
  );
};

export const TeleconsultPanel = ({ episodeId, headingLevel = 2 }: { episodeId: string; headingLevel?: 1 | 2 }) => (
  <div className="card">
    <Notice tone="warning" title={<>Teleconsultation requested <SimulatedTag>Simulated</SimulatedTag></>} headingLevel={headingLevel}>
      <p>This local request does not schedule care. A sample doctor will pick it up in the review queue. The routine path does not continue until a doctor decides.</p>
      <div className="actions">
        <LinkButton variant="secondary" to={`/patient/episodes/${episodeId}/in-person-care`}>Explore in-person care</LinkButton>
      </div>
    </Notice>
  </div>
);
