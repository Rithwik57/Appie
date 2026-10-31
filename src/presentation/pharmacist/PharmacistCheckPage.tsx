import { CircleCheck, Flag, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectAuditFor, selectCheckoutQuote, selectReviewer } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { PATIENT_DECISION_LABELS, SIMULATED_PRESCRIPTION_NOTICE } from '../../domain/copy';
import { isRoutineBlocked } from '../../domain/predicates';
import { formatDateTime } from '../../lib/time';
import { AuditList, BlockedNotice, Button, DataList, EmptyState, ErrorSummary, LinkButton, Notice, PageHeader, ReviewerCard, Section, SimulatedTag, StatusChip, TextArea } from '../components/ui';
import { useEpisodeFromParams } from '../patient/hooks';

export const PharmacistCheckPage = () => {
  const state = useAppState();
  const episode = useEpisodeFromParams();
  if (!episode) return <EmptyState title="Check unavailable" action={<LinkButton to="/pharmacist">Back to check queue</LinkButton>}>Choose a doctor-approved item from the check queue.</EmptyState>;
  if (isRoutineBlocked(episode)) return <BlockedNotice title="Routine flow paused" action={<LinkButton variant="secondary" to="/pharmacist">Back to check queue</LinkButton>}>Routine Appie flow is paused. Pharmacist checks, simulated prescriptions, and fulfillment are unavailable for this episode.</BlockedNotice>;
  if (!episode.prescription) return <BlockedNotice title="Doctor approval required" action={<LinkButton variant="secondary" to="/pharmacist">Back to check queue</LinkButton>}>A sample doctor approval is required before a pharmacist check is available.</BlockedNotice>;
  const prescription = episode.prescription;
  const decision = [...episode.decisions].reverse().find((item) => item.type === 'approve_with_prescription');
  const quote = selectCheckoutQuote();
  const last = episode.pharmacistChecks.at(-1);
  return (
    <div className="page">
      <PageHeader eyebrow={`Check ${prescription.id}`} title="Medication and fulfillment check" description={`Patient: ${state.patient.displayName}`} meta={<><StatusChip status={episode.status} /><SimulatedTag>Demonstration content only</SimulatedTag></>} actions={<LinkButton variant="ghost" to="/pharmacist">Back to check queue</LinkButton>} />
      <Notice tone="urgent" title="Not a valid prescription" headingLevel={2}><p>{SIMULATED_PRESCRIPTION_NOTICE}</p></Notice>
      <div className="grid grid--case">
        <div className="stack">
          <Section title="Placeholder items">
            <ul className="list">{prescription.items.map((item) => <li key={item.label} className="list__row"><span>{item.label}</span><small>{item.instructionsPlaceholder}</small></li>)}</ul>
          </Section>
          <Section title="Doctor decision">
            <ReviewerCard reviewer={selectReviewer(state, prescription.approvedBy)} />
            {decision && (
              <DataList items={[
                { label: 'Decision', value: PATIENT_DECISION_LABELS[decision.type] },
                { label: 'Recorded', value: <time dateTime={decision.decidedAt}>{formatDateTime(decision.decidedAt)}</time> },
                { label: 'Care-plan variant (read-only)', value: decision.guidance ?? 'None' },
              ]} />
            )}
          </Section>
          <Section title="Fulfillment details" actions={<SimulatedTag>Demo assumption</SimulatedTag>}>
            <DataList items={[
              { label: 'Pharmacy partner', value: quote.pharmacyPartner },
              { label: 'Delivery partner', value: quote.deliveryPartner },
              { label: 'Delivery estimate', value: quote.deliveryEstimate },
              { label: 'Delivery address', value: `${state.patient.address.area}, ${state.patient.address.city} (fictional)` },
            ]} />
          </Section>
        </div>
        <div className="stack">
          {episode.status === 'awaiting_pharmacist_check' ? (
            <CheckForm episodeId={episode.id} />
          ) : episode.status === 'pharmacist_flagged' ? (
            <Notice tone="warning" icon={TriangleAlert} title="Flagged: awaiting doctor re-review" headingLevel={2}><p>{last?.reason}</p></Notice>
          ) : last?.outcome === 'confirmed' ? (
            <Notice tone="success" icon={CircleCheck} title="Check completed" headingLevel={2}><p>Confirmed <time dateTime={last.checkedAt}>{formatDateTime(last.checkedAt)}</time>. The patient can continue to simulated checkout.</p></Notice>
          ) : (
            <Notice tone="neutral" title="No check needed now" headingLevel={2}><p>This item is not awaiting a pharmacist check.</p></Notice>
          )}
        </div>
      </div>
      <AuditList audit={selectAuditFor(state, episode.id)} />
    </div>
  );
};

export const CheckForm = ({ episodeId }: { episodeId: string }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [reasonError, setReasonError] = useState<string | null>(null);
  const confirm = () => {
    const result = dispatch({ type: 'PHARMACIST_CONFIRM', episodeId });
    if (result.ok) navigate('/pharmacist', { state: { toast: 'Pharmacist check confirmed.' } });
    else setError(result.error.message);
  };
  const flag = () => {
    const result = dispatch({ type: 'PHARMACIST_FLAG', episodeId, reason });
    if (result.ok) navigate('/pharmacist', { state: { toast: 'Flagged back to the sample doctor.' } });
    else if (result.error.fieldErrors?.reason) setReasonError(result.error.fieldErrors.reason);
    else setError(result.error.message);
  };
  return (
    <section className="card decision" aria-labelledby="check-controls-title">
      <h2 id="check-controls-title">Check controls</h2>
      <p className="hint">The pharmacist checks only the doctor-approved simulated item and fulfillment details. Pharmacists cannot diagnose, change care guidance or approve prescriptions here.</p>
      <ErrorSummary message={error} />
      <Button icon={CircleCheck} onClick={confirm}>Confirm medication &amp; fulfillment check</Button>
      <TextArea label="Reason to flag to doctor" value={reason} onChange={(value) => { setReason(value); setReasonError(null); }} error={reasonError ?? undefined} />
      <div className="actions"><Button variant="secondary" icon={Flag} onClick={flag}>Flag to doctor</Button></div>
    </section>
  );
};
