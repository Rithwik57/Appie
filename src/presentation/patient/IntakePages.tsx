import { ChevronDown, ChevronUp, ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { INTAKE_STEPS, resumeIntakeStep, validateIntakeStep } from '../../app/intake';
import { selectEpisode } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { BlockedNotice, Button, Card, DisclaimerInline, EmptyState, LinkButton, PageHeader, ProgressSteps, QuickReplyGroup, SimulatedTag, TextArea } from '../components/ui';
import { useEpisodeFromParams } from './hooks';

const unavailable = <EmptyState title="Health check unavailable" action={<LinkButton to="/patient">Back to dashboard</LinkButton>}>Choose a health check from your dashboard.</EmptyState>;

/** `/patient/intake`: resumes an open draft or offers to start one. */
export const IntakeEntryPage = () => {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const draft = state.episodes.find((episode) => ['consent_pending', 'intake_in_progress'].includes(episode.status));
  if (draft) return <Navigate replace to={`/patient/episodes/${draft.id}/${draft.status === 'consent_pending' ? 'consent' : 'intake'}`} />;
  const start = () => {
    const result = dispatch({ type: 'START_EPISODE' });
    if (result.ok && result.episodeId) {
      const episode = selectEpisode(result.state, result.episodeId);
      navigate(`/patient/episodes/${result.episodeId}/${episode?.status === 'intake_in_progress' ? 'intake' : 'consent'}`);
    }
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="New health check" title="Start a health check" description="You will review consent, answer five short questions, and receive a simulated, non-diagnostic preliminary assessment. A sample doctor reviews every case." />
      <Card>
        <ol className="steps-list">
          <li>Consent and privacy acknowledgement</li>
          <li>Five guided intake questions, including free text</li>
          <li>Simulated preliminary assessment, then doctor review</li>
        </ol>
        <div className="actions">
          <Button onClick={start}>Start a health check</Button>
          <LinkButton variant="ghost" to="/patient/help">Get human help instead</LinkButton>
        </div>
      </Card>
      <DisclaimerInline />
    </div>
  );
};

export const ConsentPage = () => {
  const episode = useEpisodeFromParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPrivacy, setShowPrivacy] = useState(false);
  if (!episode) return unavailable;
  if (episode.status !== 'consent_pending') {
    const intake = episode.status === 'intake_in_progress';
    return <BlockedNotice title="Consent already recorded" action={<LinkButton to={`/patient/episodes/${episode.id}${intake ? '/intake' : ''}`}>{intake ? 'Continue intake' : 'View the health-check timeline'}</LinkButton>}>Consent has already been recorded for this local demo.</BlockedNotice>;
  }
  const decide = (accept: boolean) => {
    const result = dispatch({ type: accept ? 'ACCEPT_CONSENT' : 'DECLINE_CONSENT', episodeId: episode.id });
    if (result.ok) navigate(accept ? `/patient/episodes/${episode.id}/who-for` : '/patient');
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Step 1 · Consent" title="Consent and privacy" meta={<SimulatedTag>Demo consent</SimulatedTag>} />
      <Card>
        <p>In this demo, your answers are stored locally in this browser to:</p>
        <ul className="check-list">
          <li><ShieldCheck size={18} aria-hidden="true" />create a simulated, non-diagnostic assessment</li>
          <li><ShieldCheck size={18} aria-hidden="true" />show sample doctor and pharmacist review steps</li>
          <li><ShieldCheck size={18} aria-hidden="true" />demonstrate simulated fulfillment and records</li>
        </ul>
        <button type="button" className="disclosure" aria-expanded={showPrivacy} aria-controls="privacy-detail" onClick={() => setShowPrivacy(!showPrivacy)}>
          {showPrivacy ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
          Review privacy information
        </button>
        {showPrivacy && <p id="privacy-detail" className="muted">This local demo stores fictional episode information in your browser only. No information is sent to a service. You can reset the demo at any time.</p>}
        <div className="actions">
          <Button onClick={() => decide(true)}>I agree</Button>
          <Button variant="secondary" onClick={() => decide(false)}>Decline</Button>
        </div>
        <p className="hint">If you decline, nothing is collected and you return to the dashboard.</p>
      </Card>
      <DisclaimerInline />
    </div>
  );
};

export const WhoForPage = () => {
  const episode = useEpisodeFromParams();
  if (!episode) return unavailable;
  if (episode.status !== 'intake_in_progress') return <BlockedNotice title="Consent required" action={<LinkButton to={`/patient/episodes/${episode.id}/consent`}>Review consent</LinkButton>}>Consent is required before this local demo intake can begin.</BlockedNotice>;
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Step 2 · Who is this for" title="Who is this health check for?" />
      <Card>
        <QuickReplyGroup
          legend="Choose who this health check is for"
          value="self"
          onChange={() => undefined}
          options={[
            { value: 'self', label: 'Myself', icon: UserRound },
            { value: 'other', label: 'Someone else (family/caregiver)', description: 'Not available in this release', disabled: true },
          ]}
        />
        <div className="actions">
          <LinkButton to={`/patient/episodes/${episode.id}/intake`}>Continue</LinkButton>
        </div>
      </Card>
    </div>
  );
};

export const IntakePage = () => {
  const episode = useEpisodeFromParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [step, setStep] = useState(() => (episode ? resumeIntakeStep(episode.intake) : 1));
  const [error, setError] = useState<string | null>(null);
  if (!episode) return unavailable;
  if (episode.status !== 'intake_in_progress') return <BlockedNotice title="Consent required" action={<LinkButton to={`/patient/episodes/${episode.id}/consent`}>Review consent</LinkButton>}>Consent is required before this local demo intake can begin.</BlockedNotice>;
  const definition = INTAKE_STEPS[step - 1]!;
  const value = episode.intake[definition.field];
  const update = (next: string) => {
    dispatch({ type: 'SAVE_INTAKE_DRAFT', episodeId: episode.id, patch: { [definition.field]: next } });
    setError(null);
  };
  const next = () => {
    const validation = validateIntakeStep(step, episode.intake);
    if (!validation.valid) {
      setError(Object.values(validation.fieldErrors)[0] ?? 'Complete this step.');
      return;
    }
    if (step < INTAKE_STEPS.length) {
      setStep(step + 1);
      return;
    }
    const result = dispatch({ type: 'SUBMIT_INTAKE', episodeId: episode.id });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    navigate(episode.intake.warningSigns === 'yes' ? `/patient/episodes/${episode.id}` : `/patient/episodes/${episode.id}/assessment`);
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Step 3 · Symptom intake" title="Tell us the basics" meta={<SimulatedTag>Local demo intake</SimulatedTag>} />
      <Card>
        <ProgressSteps current={step} total={INTAKE_STEPS.length} />
        {definition.options ? (
          <QuickReplyGroup legend={definition.question} options={definition.options} value={value as string | null} onChange={update} error={error ?? undefined} />
        ) : (
          <TextArea label={definition.question} hint="Optional. Avoid sharing real personal details in this demo." value={episode.intake.freeText} onChange={update} error={error ?? undefined} />
        )}
        <div className="actions actions--split">
          {step > 1 ? <Button variant="secondary" onClick={() => { setStep(step - 1); setError(null); }}>Back</Button> : <Link to="/patient">Save and exit</Link>}
          <Button onClick={next}>{step === INTAKE_STEPS.length ? 'Submit health check' : 'Continue'}</Button>
        </div>
      </Card>
      <DisclaimerInline />
    </div>
  );
};
