import { ArrowRight, FlaskConical, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROLE_DESCRIPTIONS, selectDemoIdentity } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { NO_PASSWORD_NOTICE } from '../../domain/copy';
import type { Role } from '../../domain/types';
import { Button, ErrorSummary, SimulatedTag } from '../components/ui';
import { ResetDemoButton } from '../layout/ResetDemoButton';
import { ROLE_ORDER, WORKSPACES } from '../layout/workspaces';

const RoleCard = ({ role, onContinue }: { role: Role; onContinue: (role: Role) => void }) => {
  const state = useAppState();
  const config = WORKSPACES[role];
  const identity = selectDemoIdentity(state, role);
  const Icon = config.icon;
  const headingId = `role-card-${role}-title`;
  const userId = `role-card-${role}-user`;
  return (
    <article className={`role-card ${config.accentClass}`} aria-labelledby={headingId}>
      <span className="role-card__icon" aria-hidden="true"><Icon size={26} /></span>
      <h2 id={headingId}>{config.label}</h2>
      <p className="role-card__user" id={userId}>
        <strong>{identity.displayName}</strong>
        <SimulatedTag>Seeded demo user</SimulatedTag>
      </p>
      <p className="role-card__description">{ROLE_DESCRIPTIONS[role]}</p>
      <p className="role-card__destination">Opens: {config.destination}</p>
      <Button className="role-card__cta" aria-describedby={`${headingId} ${userId}`} onClick={() => onContinue(role)}>
        Continue as demo user
        <ArrowRight size={18} aria-hidden="true" />
      </Button>
    </article>
  );
};

export const RoleSelectPage = () => {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const continueAs = (role: Role) => {
    const result = dispatch({ type: 'SWITCH_ROLE', role });
    if (result.ok) navigate(WORKSPACES[role].home);
    else setError(result.error.message);
  };
  const load = (scenario: 'routine' | 'urgent' | 'unclear') => {
    const result = dispatch({ type: 'LOAD_SCENARIO', scenario });
    if (!result.ok || result.episodeId === undefined) {
      setError(result.ok ? 'The demo scenario could not be loaded.' : result.error.message);
      return;
    }
    dispatch({ type: 'SWITCH_ROLE', role: 'patient' });
    navigate(`/patient/episodes/${result.episodeId}`);
  };
  const current = state.role === null ? null : WORKSPACES[state.role];
  return (
    <main id="main" tabIndex={-1} className="entry">
      <section className="entry-hero" aria-labelledby="entry-title">
        <p className="brand brand--large">
          <span className="brand__mark" aria-hidden="true">a</span>
          <span className="brand__word">Appie</span>
        </p>
        <h1 id="entry-title">Choose a demo role to explore Appie</h1>
        <p className="entry-hero__lede">
          Appie is a simulated digital healthcare assistant for routine, low-acuity concerns. Follow one shared demo episode from patient intake through doctor review, pharmacist check, simulated checkout and delivery.
        </p>
        <p className="tag tag--large"><FlaskConical size={14} aria-hidden="true" />Simulated, non-clinical prototype</p>
        {current && state.role && (
          <p className="entry-hero__current">
            You are viewing as {selectDemoIdentity(state, state.role).displayName}, {current.label} (demo). <Link to={current.home}>Return to workspace</Link>
          </p>
        )}
      </section>
      <ErrorSummary message={error} />
      <section aria-label="Demo roles" className="role-grid">
        {ROLE_ORDER.map((role) => <RoleCard key={role} role={role} onContinue={continueAs} />)}
      </section>
      <p className="entry-note">
        <KeyRound size={18} aria-hidden="true" />
        <span>{NO_PASSWORD_NOTICE}</span>
      </p>
      <section className="card demo-panel" aria-labelledby="demo-data-title">
        <div className="section__header">
          <h2 id="demo-data-title">Demo data</h2>
          <SimulatedTag>Stored only in this browser</SimulatedTag>
        </div>
        <p className="muted">Progress is saved locally so you can switch roles and continue the same workflow. Reset restores the seeded patient, reviewers, operations user and the routine, urgent and unclear cases.</p>
        <div className="actions">
          <ResetDemoButton variant="secondary" />
          <Button variant="ghost" onClick={() => load('routine')}>Load a new routine case</Button>
          <Button variant="ghost" onClick={() => load('urgent')}>Load a new urgent case</Button>
          <Button variant="ghost" onClick={() => load('unclear')}>Load a new unclear case</Button>
        </div>
      </section>
    </main>
  );
};
