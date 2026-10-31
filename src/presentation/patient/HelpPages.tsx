import { Hospital, Phone, Video } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { selectCurrentEpisode } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { EMERGENCY_GUIDANCE } from '../../domain/copy';
import { canRequestTeleconsult } from '../../review/gates';
import { BlockedNotice, Button, EmptyState, LinkButton, MockBoundaryNote, Notice, PageHeader, Section, SimulatedTag, TextArea } from '../components/ui';
import { TeleconsultPanel } from './EpisodePages';
import { useEpisodeFromParams } from './hooks';

export const HelpPage = () => {
  const episode = selectCurrentEpisode(useAppState());
  return (
    <div className="page">
      <PageHeader eyebrow="Human help" title="Get human help" description="Use these simulated routes to explore when the routine prototype flow needs human or in-person support." />
      <Notice tone="urgent" title="In an emergency" headingLevel={2}><p>{EMERGENCY_GUIDANCE}</p></Notice>
      <div className="grid grid--two">
        <Section title="Teleconsultation (simulated)">
          <p className="muted">Ask for a sample doctor to follow up on your current health check.</p>
          {episode && canRequestTeleconsult(episode) ? <LinkButton icon={Video} to={`/patient/episodes/${episode.id}/teleconsult`}>Request teleconsultation</LinkButton> : <p className="muted">{episode ? 'A teleconsultation is already requested or not available at this stage.' : 'Start a health check to request a teleconsultation.'}</p>}
        </Section>
        <Section title="In-person care">
          <p className="muted">Real-world clinics, hospitals and emergency services are outside Appie.</p>
          <LinkButton variant="secondary" icon={Hospital} to={episode ? `/patient/episodes/${episode.id}/in-person-care` : '/patient/in-person-care'}>Explore in-person care</LinkButton>
        </Section>
      </div>
    </div>
  );
};

export const TeleconsultPage = () => {
  const episode = useEpisodeFromParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [note, setNote] = useState('I would like human help in this local demo.');
  const [error, setError] = useState<string | null>(null);
  if (!episode) return <EmptyState title="Health check unavailable" action={<LinkButton to="/patient">Back to dashboard</LinkButton>}>Return to dashboard.</EmptyState>;
  if (episode.status === 'teleconsult_requested') return <div className="page page--narrow"><TeleconsultPanel episodeId={episode.id} headingLevel={1} /></div>;
  if (!canRequestTeleconsult(episode)) return <BlockedNotice title="Human help not available here">Human help is not available at this stage.</BlockedNotice>;
  const submit = () => {
    const result = dispatch({ type: 'REQUEST_TELECONSULT', episodeId: episode.id, note });
    if (result.ok) navigate(`/patient/episodes/${episode.id}`);
    else setError(result.error.fieldErrors?.note ?? result.error.message);
  };
  return (
    <div className="page page--narrow">
      <PageHeader eyebrow="Human help" title="Request human help" meta={<SimulatedTag>Teleconsult demo</SimulatedTag>} description="This creates a fictional local request, not an appointment or a real teleconsultation." />
      <Section title="Your request">
        <TextArea label="What would you like help with?" value={note} onChange={(value) => { setNote(value); setError(null); }} error={error ?? undefined} maxLength={300} />
        <div className="actions">
          <Button icon={Video} onClick={submit}>Request teleconsultation (simulated)</Button>
          <LinkButton variant="ghost" to={`/patient/episodes/${episode.id}/in-person-care`}>Consider in-person care instead</LinkButton>
        </div>
      </Section>
    </div>
  );
};

export const InPersonCarePage = () => (
  <div className="page page--narrow">
    <PageHeader eyebrow="Human help" title="In-person care" />
    <Notice tone="urgent" icon={Phone} title="If this could be an emergency" headingLevel={2}><p>{EMERGENCY_GUIDANCE}</p></Notice>
    <Section title="Nearby options">
      <p>For real care, consider visiting a nearby clinic or hospital. These are external, real-world options. Appie does not operate a clinic or manage emergency care.</p>
      <p>Sample local options <SimulatedTag>Illustrative only</SimulatedTag>: a nearby clinic, hospital outpatient department, or local emergency service.</p>
      <LinkButton variant="secondary" to="/patient/help">Back to human help</LinkButton>
    </Section>
  </div>
);

export const PrivacyPage = () => (
  <div className="page page--narrow">
    <PageHeader eyebrow="Privacy" title="Privacy information" />
    <Section title="How this demo stores data">
      <p>Appie is a local prototype. Its fictional health-check answers remain in browser localStorage for this demonstration. They are not transmitted, shared, or used for care.</p>
      <MockBoundaryNote name="Privacy and health-record interoperability" />
      <LinkButton variant="secondary" to="/patient">Back to dashboard</LinkButton>
    </Section>
  </div>
);
