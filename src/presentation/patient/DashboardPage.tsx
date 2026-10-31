import { ArrowRight, CirclePause, FileText, LifeBuoy, Package, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { selectActiveOrders, selectCurrentEpisode, selectEpisode, selectRecentDoneEpisodes } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { CONCERN_LABELS } from '../../domain/copy';
import { STATUS_META } from '../../domain/status';
import type { Episode } from '../../domain/types';
import { isRoutineBlocked } from '../../domain/predicates';
import { formatDateTime } from '../../lib/time';
import { Button, Card, DeliveryChip, DisclaimerInline, LinkButton, MockBoundaryNote, Notice, PageHeader, Section, SimulatedTag, StatusChip } from '../components/ui';

const STAGES = ['Intake', 'Doctor review', 'Pharmacist check', 'Order'] as const;
const stageIndex = (episode: Episode): number => {
  if (['consent_pending', 'intake_in_progress', 'consent_declined'].includes(episode.status)) return 0;
  if (['awaiting_pharmacist_check', 'pharmacist_flagged'].includes(episode.status)) return 2;
  if (episode.order !== null || episode.status === 'ready_for_checkout') return 3;
  return 1;
};

const nextStep = (episode: Episode): { to: string; label: string } => {
  const base = `/patient/episodes/${episode.id}`;
  if (episode.status === 'consent_pending') return { to: `${base}/consent`, label: 'Continue to consent' };
  if (episode.status === 'intake_in_progress') return { to: `${base}/intake`, label: 'Continue intake' };
  if (episode.status === 'ready_for_checkout') return { to: `${base}/checkout`, label: 'Continue to simulated checkout' };
  if (episode.order !== null) return { to: `/patient/orders/${episode.order.id}`, label: 'Track order' };
  return { to: base, label: 'View episode' };
};

const CurrentEpisode = ({ episode }: { episode: Episode }) => {
  const paused = isRoutineBlocked(episode);
  const index = stageIndex(episode);
  const next = nextStep(episode);
  return (
    <Section title="Current health check" className={`current-episode ${paused ? 'current-episode--paused' : ''}`.trim()} actions={<StatusChip status={episode.status} />}>
      <p className="lede">{episode.intake.concernArea ? CONCERN_LABELS[episode.intake.concernArea] : 'New health check'} · started <time dateTime={episode.createdAt}>{formatDateTime(episode.createdAt)}</time></p>
      {paused ? (
        <Notice tone="urgent" icon={CirclePause} title="Routine Appie flow paused" headingLevel={3}>
          <p>{STATUS_META[episode.status].patientSummary}</p>
        </Notice>
      ) : (
        <>
          <p>{STATUS_META[episode.status].patientSummary}</p>
          <ol className="mini-progress" aria-label="Health check progress">
            {STAGES.map((stage, position) => (
              <li key={stage} className={position < index ? 'is-done' : position === index ? 'is-current' : ''} aria-current={position === index ? 'step' : undefined}>
                <span>{stage}</span>
                <small>{position < index ? 'Done' : position === index ? 'Current' : 'Upcoming'}</small>
              </li>
            ))}
          </ol>
        </>
      )}
      <div className="actions">
        <LinkButton to={next.to} icon={ArrowRight}>{paused ? 'View guidance' : next.label}</LinkButton>
        <LinkButton variant="ghost" to={`/patient/records/${episode.id}`}>View record</LinkButton>
      </div>
    </Section>
  );
};

export const DashboardPage = () => {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const current = selectCurrentEpisode(state);
  const done = selectRecentDoneEpisodes(state);
  const orders = selectActiveOrders(state);
  const consentDeclined = state.episodes.some((episode) => episode.status === 'consent_declined');
  const start = () => {
    const result = dispatch({ type: 'START_EPISODE' });
    if (result.ok && result.episodeId) {
      const episode = selectEpisode(result.state, result.episodeId);
      navigate(`/patient/episodes/${result.episodeId}/${episode?.status === 'intake_in_progress' ? 'intake' : 'consent'}`);
    }
  };
  return (
    <div className="page">
      <PageHeader
        eyebrow="Patient dashboard"
        title={`Hello, ${state.patient.displayName}`}
        description="Start a simulated health check, follow sample doctor and pharmacist decisions, and track the demo order."
        actions={<Button icon={Plus} onClick={start}>Start a health check</Button>}
      />
      {consentDeclined && (
        <Card className="card--soft">
          <h2>Your choice was respected</h2>
          <p>You chose not to share information. No intake information was collected for that local demo.</p>
          <Button variant="secondary" onClick={start}>Reconsider and start again</Button>
        </Card>
      )}
      <div className="grid grid--dashboard">
        <div className="grid__main stack">
          {current ? (
            <CurrentEpisode episode={current} />
          ) : (
            <Section title="No current health check">
              <p>Start a local demo health check when you are ready.</p>
            </Section>
          )}
          <Section title="Recent episodes" actions={<Link to="/patient/records">All records</Link>}>
            {done.length ? (
              <ul className="list">
                {done.map((episode) => (
                  <li key={episode.id} className="list__row">
                    <Link to={`/patient/records/${episode.id}`}>{episode.intake.concernArea ? CONCERN_LABELS[episode.intake.concernArea] : 'Demo episode'}</Link>
                    <StatusChip status={episode.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No completed demo episodes yet.</p>
            )}
          </Section>
        </div>
        <aside className="grid__side stack" aria-label="Orders and help">
          <Section title="Active orders" actions={<SimulatedTag>Fictional</SimulatedTag>}>
            {orders.length ? (
              <ul className="list">
                {orders.map(({ order, episode }) => (
                  <li key={order.id} className="list__row">
                    <Link to={`/patient/orders/${order.id}`}><Package size={16} aria-hidden="true" /> {order.id}</Link>
                    {episode.tracking && <DeliveryChip status={episode.tracking.current} />}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No active orders. Orders appear after simulated checkout.</p>
            )}
          </Section>
          <Section title="Records">
            <p className="muted">Episodes, reviewer decisions, orders and audit history.</p>
            <LinkButton variant="secondary" icon={FileText} to="/patient/records">Open health records</LinkButton>
          </Section>
          <Section title="Need a person?">
            <p className="muted">Teleconsultation, in-person care and emergency guidance.</p>
            <LinkButton variant="secondary" icon={LifeBuoy} to="/patient/help">Get human help</LinkButton>
          </Section>
        </aside>
      </div>
      <MockBoundaryNote name="Future records, laboratory, payment, pharmacy and delivery services" />
      <DisclaimerInline />
    </div>
  );
};
