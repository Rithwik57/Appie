import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { selectDemoIdentity } from '../../app/selectors';
import { useAppState, useDispatch } from '../../app/store';
import { DEMO_ROLE_NOTICE, PROTOTYPE_DISCLAIMER } from '../../domain/copy';
import type { Role } from '../../domain/types';
import { Button, IdentityBadge } from '../components/ui';
import { ResetDemoButton } from './ResetDemoButton';
import { RoleGate } from './RoleGate';
import { WORKSPACES } from './workspaces';

export const WorkspaceLayout = ({ role }: { role: Role }) => {
  const state = useAppState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const config = WORKSPACES[role];
  const Icon = config.icon;
  const active = state.role === role;
  const identity = selectDemoIdentity(state, role);
  useEffect(() => setMenuOpen(false), [location.pathname]);
  const signOut = () => {
    dispatch({ type: 'SIGN_OUT' });
    navigate('/');
  };
  const navId = `${role}-workspace-nav`;
  return (
    <div className={`workspace ${config.accentClass}`}>
      <header className="ws-header">
        <div className="ws-header__inner">
          <Link to={config.home} className="brand" aria-label={`Appie, ${config.workspaceLabel} home`}>
            <span className="brand__mark" aria-hidden="true">a</span>
            <span className="brand__word">Appie</span>
          </Link>
          <div className="ws-indicator" aria-label="Current demo workspace">
            <span className="ws-indicator__eyebrow"><Icon size={14} aria-hidden="true" />{config.workspaceLabel}</span>
            {active ? <IdentityBadge identity={identity} compact /> : <span className="muted">No matching demo role</span>}
            <small>{DEMO_ROLE_NOTICE}</small>
          </div>
          <div className="ws-header__actions">
            {active && config.nav.length > 1 && (
              <button type="button" className="button button--ghost menu-toggle" aria-expanded={menuOpen} aria-controls={navId} onClick={() => setMenuOpen((open) => !open)}>
                {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
                Menu
              </button>
            )}
            <Button variant="secondary" icon={LogOut} onClick={signOut}>Sign out / Change demo role</Button>
          </div>
        </div>
        {active && (
          <nav aria-label={`${config.label} workspace`} id={navId} className={`ws-nav ${menuOpen ? 'ws-nav--open' : ''} ${config.nav.length > 1 ? 'ws-nav--collapsible' : ''}`.trim()}>
            <ul>
              {config.nav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end ?? false} className={({ isActive }) => `ws-nav__link ${isActive ? 'ws-nav__link--active' : ''}`.trim()}>
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main id="main" tabIndex={-1} className="ws-main">
        <RoleGate role={role}>
          <Outlet />
        </RoleGate>
      </main>
      <footer className="ws-footer">
        <div className="ws-footer__inner">
          <p>{PROTOTYPE_DISCLAIMER}</p>
          <div className="cluster">
            {role === 'patient' && active && <Link to="/patient/privacy">Privacy information</Link>}
            <Link to="/">Role selection</Link>
            <ResetDemoButton />
          </div>
        </div>
      </footer>
    </div>
  );
};
