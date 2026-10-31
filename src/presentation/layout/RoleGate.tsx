import { KeyRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { selectDemoIdentity } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { DEMO_ROLE_NOTICE } from '../../domain/copy';
import type { Role } from '../../domain/types';
import { Button, LinkButton, Notice } from '../components/ui';
import { WORKSPACES } from './workspaces';

/**
 * Shows the workspace only when the matching demo role is selected.
 * This is a demo convenience, not access control.
 */
export const RoleGate = ({ role, children }: { role: Role; children: ReactNode }) => {
  const state = useAppState();
  const dispatch = useDispatch();
  if (state.role === role) return <>{children}</>;
  const target = WORKSPACES[role];
  const identity = selectDemoIdentity(state, role);
  const continueHere = () => dispatch({ type: 'SWITCH_ROLE', role });
  if (state.role === null) {
    return (
      <div className="card gate">
        <Notice tone="info" icon={KeyRound} title="Choose a demo role to open this page" headingLevel={1}>
          <p>This page is part of the {target.workspaceLabel}. Continue as the seeded demo user to view it. {DEMO_ROLE_NOTICE}.</p>
          <div className="actions">
            <Button onClick={continueHere}>Continue as {identity.displayName}</Button>
            <LinkButton variant="secondary" to="/">Go to role selection</LinkButton>
          </div>
        </Notice>
      </div>
    );
  }
  const current = WORKSPACES[state.role];
  const currentIdentity = selectDemoIdentity(state, state.role);
  return (
    <div className="card gate">
      <Notice tone="warning" icon={KeyRound} title={`This page belongs to the ${target.workspaceLabel}`} headingLevel={1}>
        <p>You are viewing as {currentIdentity.displayName}, {current.label} (demo). Switching demo role is a convenience, not a sign-in.</p>
        <div className="actions">
          <Button onClick={continueHere}>Switch to {target.label} demo user</Button>
          <LinkButton variant="secondary" to={current.home}>Back to {current.workspaceLabel}</LinkButton>
        </div>
      </Notice>
    </div>
  );
};
