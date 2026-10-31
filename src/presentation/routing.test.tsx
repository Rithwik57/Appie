import { fireEvent, screen, within } from '@testing-library/react';
import { buildSeedState } from '../data/seed';
import { REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import { renderApp, run, savedState, withRole } from '../test/renderApp';

beforeEach(() => window.localStorage.clear());

const card = (name: string) => screen.getByRole('heading', { level: 2, name }).closest('article')!;

describe('role-selection entry page', () => {
  it('shows four role cards, the no-password note and the disclaimer, and no role dropdown', () => {
    renderApp('/');
    for (const name of ['Patient', 'Doctor', 'Pharmacist', 'Fulfillment / Delivery Operations']) expect(card(name)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Continue as demo user' })).toHaveLength(4);
    expect(screen.getByText(/No password, account or backend sign-in/)).toBeInTheDocument();
    expect(screen.getByRole('note', { name: 'Prototype disclaimer' })).toHaveTextContent('not medical advice');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('continuing as patient opens the patient workspace and persists the role', async () => {
    const { router } = renderApp('/');
    fireEvent.click(within(card('Patient')).getByRole('button', { name: 'Continue as demo user' }));
    expect(router.state.location.pathname).toBe('/patient');
    expect(await screen.findByLabelText('Current demo workspace')).toHaveTextContent('Aarav (demo)');
    expect(savedState().role).toBe('patient');
  });

  it('sign out returns to role selection, clears only the role', async () => {
    const { router } = renderApp('/patient', withRole(buildSeedState(), 'patient'));
    fireEvent.click(await screen.findByRole('button', { name: 'Sign out / Change demo role' }));
    expect(router.state.location.pathname).toBe('/');
    expect(savedState().role).toBeNull();
    expect(savedState().episodes).toEqual(buildSeedState().episodes);
  });

  it('reset from the entry page restores the seed and keeps the role', async () => {
    const state = run(withRole(buildSeedState(), 'patient'), { type: 'START_EPISODE' });
    expect(state.episodes).toHaveLength(5);
    renderApp('/', state);
    fireEvent.click(screen.getByRole('button', { name: 'Reset demo data' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset demo data' }));
    expect(savedState().episodes).toHaveLength(4);
    expect(savedState().role).toBe('patient');
    expect(await screen.findByText('Demo data reset to the seed state.')).toBeInTheDocument();
  });
});

describe('direct loads and redirects', () => {
  it('a signed-out direct load offers to continue as that role in place', async () => {
    const { router } = renderApp('/doctor', buildSeedState());
    expect(await screen.findByRole('heading', { name: 'Choose a demo role to open this page' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Continue as Dr\. Meera Iyer/ }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Doctor review queue' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/doctor');
  });

  it('a mismatched role shows the workspace notice with both actions', async () => {
    renderApp('/pharmacist', withRole(buildSeedState(), 'patient'));
    expect(await screen.findByRole('heading', { name: /This page belongs to the Pharmacist workspace/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to Pharmacist demo user' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Patient workspace' })).toBeInTheDocument();
  });

  it('unknown routes show a useful not-found page', () => {
    renderApp('/no-such-page');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to role selection' })).toHaveAttribute('href', '/');
  });

  it('legacy routes redirect to the new paths', () => {
    const ops = renderApp('/ops', withRole(buildSeedState(), 'ops'));
    expect(ops.router.state.location.pathname).toBe('/operations');
    ops.unmount();
    const doctor = renderApp('/doctor/review/ep-routine-01', withRole(buildSeedState(), 'doctor'));
    expect(doctor.router.state.location.pathname).toBe('/doctor/cases/ep-routine-01');
  });

  it('each workspace has exactly one labelled nav and no role select', async () => {
    const cases = [['/patient', 'patient', 'Patient workspace'], ['/doctor', 'doctor', 'Doctor workspace'], ['/pharmacist', 'pharmacist', 'Pharmacist workspace'], ['/operations', 'ops', 'Fulfillment / Delivery Operations workspace']] as const;
    for (const [path, role, label] of cases) {
      const view = renderApp(path, withRole(buildSeedState(), role));
      const navs = await screen.findAllByRole('navigation');
      expect(navs).toHaveLength(1);
      expect(navs[0]).toHaveAccessibleName(label);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      view.unmount();
      window.localStorage.clear();
    }
  });
});

describe('patient workspace', () => {
  it('order page shows the status and history operations wrote, with no advance control', async () => {
    renderApp('/patient/orders/SIM-ORD-0001', withRole(buildSeedState(), 'patient'));
    expect(await screen.findByRole('heading', { level: 1, name: 'Order SIM-ORD-0001' })).toBeInTheDocument();
    expect(screen.getAllByText('Done')).toHaveLength(5);
    expect(screen.getAllByText(/Updated by Kavya Rao \(sample\)/)).toHaveLength(4);
    expect(screen.queryByRole('button', { name: /advance|mark as/i })).not.toBeInTheDocument();
  });

  it('checkout shows the seeded patient address', async () => {
    const ready = run(buildSeedState(),
      { type: 'SWITCH_ROLE', role: 'doctor' }, { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
      { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' },
      { type: 'SWITCH_ROLE', role: 'pharmacist' }, { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' });
    renderApp('/patient/episodes/ep-routine-01/checkout', withRole(ready, 'patient'));
    expect(await screen.findByText(/Flat 4B, Sample Residency/)).toBeInTheDocument();
    expect(screen.queryByText(/17 Sample Lane/)).not.toBeInTheDocument();
  });

  it('urgent checkout and tracking routes show the blocked state', async () => {
    const state = withRole(buildSeedState(), 'patient');
    const checkout = renderApp('/patient/episodes/ep-urgent-01/checkout', state);
    expect(await screen.findByText('Routine flow blocked')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Pay/ })).not.toBeInTheDocument();
    checkout.unmount();
    renderApp('/patient/episodes/ep-urgent-01/tracking', state);
    expect(await screen.findByText(/Delivery tracking is unavailable/)).toBeInTheDocument();
  });

  it('/patient/intake redirects to the open draft consent page', async () => {
    const state = run(withRole(buildSeedState(), 'patient'), { type: 'START_EPISODE' });
    const { router } = renderApp('/patient/intake', state);
    expect(await screen.findByRole('heading', { level: 1, name: 'Consent and privacy' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/patient/episodes/ep-0001/consent');
  });
});

describe('doctor and pharmacist workspaces', () => {
  it('doctor queue shows seeded patient name and triage, urgent only under Escalated', async () => {
    renderApp('/doctor', withRole(buildSeedState(), 'doctor'));
    const panel = await screen.findByRole('tabpanel');
    expect(within(panel).getAllByText('Aarav (demo)')).toHaveLength(2);
    expect(within(panel).getByText('Looks routine')).toBeInTheDocument();
    expect(within(panel).getByText('Needs more human input')).toBeInTheDocument();
    expect(within(panel).queryByText('Possibly urgent')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Escalated/ }));
    expect(within(screen.getByRole('tabpanel')).getByText('Possibly urgent')).toBeInTheDocument();
  });

  it('pharmacist check page renders only the two pharmacist controls', async () => {
    const state = run(buildSeedState(), { type: 'SWITCH_ROLE', role: 'doctor' }, { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
      { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' });
    renderApp('/pharmacist/checks/ep-routine-01', withRole(state, 'pharmacist'));
    const main = await screen.findByRole('main');
    const buttons = within(main).getAllByRole('button').map((button) => button.textContent);
    expect(buttons).toEqual(['Confirm medication & fulfillment check', 'Flag to doctor']);
    expect(within(main).queryByRole('combobox')).not.toBeInTheDocument();
    expect(within(main).queryByRole('radio')).not.toBeInTheDocument();
  });

  it('/pharmacist/checks/ep-urgent-01 shows the paused state', async () => {
    renderApp('/pharmacist/checks/ep-urgent-01', withRole(buildSeedState(), 'pharmacist'));
    expect(await screen.findByRole('heading', { name: 'Routine flow paused' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Confirm medication/ })).not.toBeInTheDocument();
  });

  it('pharmacist Awaiting tab is empty for the seed and lists the routine case after approval', async () => {
    const empty = renderApp('/pharmacist', withRole(buildSeedState(), 'pharmacist'));
    expect(await screen.findByText(/No doctor-approved items are waiting/)).toBeInTheDocument();
    empty.unmount();
    const approved = run(buildSeedState(), { type: 'SWITCH_ROLE', role: 'doctor' }, { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
      { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' });
    renderApp('/pharmacist', withRole(approved, 'pharmacist'));
    expect(await screen.findByRole('link', { name: /Open check/ })).toHaveAttribute('href', '/pharmacist/checks/ep-routine-01');
  });
});
