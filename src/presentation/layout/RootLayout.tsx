import { FlaskConical } from 'lucide-react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { PROTOTYPE_DISCLAIMER } from '../../domain/copy';

/** Root of every route: skip link and the persistent prototype disclaimer. */
export const RootLayout = ({ children }: { children?: ReactNode }) => (
  <div className="app">
    <a className="skip-link" href="#main">Skip to main content</a>
    <div aria-label="Prototype disclaimer" role="note" className="global-disclaimer">
      <FlaskConical aria-hidden="true" size={16} />
      <span>{PROTOTYPE_DISCLAIMER}</span>
    </div>
    {children ?? <Outlet />}
  </div>
);
