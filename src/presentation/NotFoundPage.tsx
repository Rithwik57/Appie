import { Compass } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../app/store';
import { LinkButton } from './components/ui';
import { WORKSPACES } from './layout/workspaces';

export const NotFoundPage = ({ standalone = false }: { standalone?: boolean }) => {
  const { role } = useAppState();
  const location = useLocation();
  const workspace = role === null ? null : WORKSPACES[role];
  const body = (
      <div className="card empty-state" aria-labelledby="not-found-title">
        <span className="empty-state__icon" aria-hidden="true"><Compass size={28} /></span>
        <h1 id="not-found-title">Page not found</h1>
        <p>This demo route does not exist: <code>{location.pathname}</code></p>
        <div className="actions actions--center">
          <LinkButton to="/">Go to role selection</LinkButton>
          {workspace && <LinkButton variant="secondary" to={workspace.home}>Go to {workspace.workspaceLabel}</LinkButton>}
        </div>
      </div>
  );
  return standalone ? <main id="main" tabIndex={-1} className="entry entry--narrow">{body}</main> : body;
};
