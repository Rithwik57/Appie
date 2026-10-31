import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { STORAGE_KEY } from '../data/persistence';
import { buildSeedState } from '../data/seed';
import { StoreProvider } from '../app/store';
import { applyAction } from '../app/stateMachine';
import type { Action } from '../app/actions';
import { REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import type { AppState, Role } from '../domain/types';
import { routes } from '../routes';

/** Mounts the real route tree with a memory router and the persisted state given. */
export const renderApp = (path: string, state?: AppState) => {
  if (state) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const view = render(<StoreProvider><RouterProvider router={router} /></StoreProvider>);
  return { ...view, router };
};

export const savedState = (): AppState => JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as AppState;

export const run = (state: AppState, ...actions: Action[]): AppState =>
  actions.reduce((current, action) => {
    const result = applyAction(current, action);
    if (!result.ok) throw new Error(`${action.type}: ${result.error.message}`);
    return result.state;
  }, state);

export const withRole = (state: AppState, role: Role | null): AppState => ({ ...state, role });

/** Routine case through doctor approval, pharmacist confirmation and simulated payment. */
export const paidRoutineState = (): AppState =>
  run(
    buildSeedState(),
    { type: 'SWITCH_ROLE', role: 'doctor' },
    { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
    { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' },
    { type: 'SWITCH_ROLE', role: 'pharmacist' },
    { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' },
    { type: 'SWITCH_ROLE', role: 'patient' },
    { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' },
  );
