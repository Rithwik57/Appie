import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { buildSeedState } from '../data/seed';
import { STORAGE_KEY } from '../data/persistence';
import { StoreProvider } from '../app/store';
import { DoctorQueuePage } from './doctor/DoctorQueuePage';
import { DashboardPage } from './patient/DashboardPage';
import { EmergencyPanel, ReviewerDecisionPanel } from './patient/EpisodePages';
import { PrescriptionSummaryPage } from './patient/CheckoutPages';
import { RecordDetailPage } from './patient/RecordsPages';
import { DecisionForm } from './doctor/DoctorCasePage';
import { ConfirmDialog, QuickReplyGroup, Tabs, TextArea } from './components/ui';
import { applyAction } from '../app/stateMachine';
import { REVIEWER_APPROVED_GUIDANCE, SIMULATED_CARE_PLAN_VARIANTS } from '../domain/copy';
import { CheckForm } from './pharmacist/PharmacistCheckPage';
import { useState } from 'react';
import type { AppState } from '../domain/types';

const renderWithStore = (children: React.ReactNode) => render(<StoreProvider><MemoryRouter>{children}</MemoryRouter></StoreProvider>);

beforeEach(() => {
  window.localStorage.clear();
});

describe('consent recovery', () => {
  it('acknowledges a declined consent choice and offers a fresh start', () => {
    let state: AppState = { ...buildSeedState(), role: 'patient' };
    const started = applyAction(state, { type: 'START_EPISODE' });
    if (!started.ok) throw new Error(started.error.message);
    state = started.state;
    const declined = applyAction(state, { type: 'DECLINE_CONSENT', episodeId: started.episodeId! });
    if (!declined.ok) throw new Error(declined.error.message);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(declined.state));

    renderWithStore(<DashboardPage />);

    expect(screen.getByText('Your choice was respected')).toBeInTheDocument();
    expect(screen.getByText(/No intake information was collected/)).toBeInTheDocument();
    const reconsider = screen.getByRole('button', { name: 'Reconsider and start again' });
    expect(reconsider).toBeInTheDocument();

    fireEvent.click(reconsider);
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof buildSeedState>;
    const restarted = saved.episodes.at(-1)!;
    expect(restarted.status).toBe('consent_pending');
    expect(restarted.intake).toMatchObject({ concernArea: null, duration: null, severity: null, warningSigns: null, freeText: '', submittedAt: null });
  });
});

describe('presentation safety gates', () => {
  it('keeps urgent escalation free of routine fulfillment actions', () => {
    renderWithStore(<EmergencyPanel episodeId="ep-urgent-01" />);
    expect(screen.getByText('Routine Appie flow paused')).toBeInTheDocument();
    expect(screen.queryByText(/checkout/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/prescription/i)).not.toBeInTheDocument();
  });

  it('renders only pharmacist check and flag actions', () => {
    renderWithStore(<CheckForm episodeId="ep-routine-01" />);
    expect(screen.getByRole('button', { name: /confirm medication/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /flag to doctor/i })).toBeInTheDocument();
  });

  it('blocks a prescription route until doctor approval', () => {
    render(<StoreProvider><MemoryRouter initialEntries={['/patient/episodes/ep-urgent-01/prescription']}><PrescriptionSummaryPage /></MemoryRouter></StoreProvider>);
    expect(screen.getByText('Routine flow blocked')).toBeInTheDocument();
  });
});

describe('review handoffs', () => {
  it('renders the simulated assessment category, submitted time, and icon in the doctor queue', () => {
    renderWithStore(<DoctorQueuePage />);
    const routineItem = screen.getByText('Looks routine').closest('li.queue__row');
    expect(routineItem).not.toBeNull();
    expect(routineItem).toHaveTextContent('Submitted:');
    expect(routineItem?.querySelector('svg')).not.toBeNull();
    expect(screen.getByText('Needs more human input')).toBeInTheDocument();
  });

  it('shows a completed prescription decision with its recorded time and next action', () => {
    renderWithStore(<ReviewerDecisionPanel episodeId="ep-hist-01" />);
    expect(screen.getByText(/Care guidance and simulated prescription approved/)).toBeInTheDocument();
    expect(screen.getByText(/Recorded:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view simulated prescription and order/i })).toBeInTheDocument();
  });

  it('provides a record next action for a no-prescription decision', () => {
    const state = buildSeedState();
    const episode = state.episodes.find((candidate) => candidate.id === 'ep-routine-01')!;
    episode.status = 'care_guidance_final';
    episode.decisions = [{
      id: 'dec-test', reviewerId: state.reviewers.find((reviewer) => reviewer.role === 'doctor')!.id,
      type: 'finalize_without_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, guidanceEdited: false,
      note: 'Sample decision.', decidedAt: '2025-01-15T09:00:00+05:30',
    }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderWithStore(<ReviewerDecisionPanel episodeId={episode.id} />);
    expect(screen.getByText(/Care guidance finalised without a prescription/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view complete record/i })).toBeInTheDocument();
  });

  it('renders full simulated fulfillment history in a record', () => {
    render(<StoreProvider><MemoryRouter initialEntries={['/patient/records/ep-hist-01']}><Routes><Route path="/patient/records/:episodeId" element={<RecordDetailPage />} /></Routes></MemoryRouter></StoreProvider>);
    expect(screen.getByText('Doctor decisions')).toBeInTheDocument();
    expect(screen.getByText('Simulated prescription and pharmacist check')).toBeInTheDocument();
    expect(screen.getByText('Simulated order and delivery')).toBeInTheDocument();
    expect(screen.getAllByText(/Demo medication item A/)).toHaveLength(2);
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0);
  });

  it('renders the selected edited care-plan variant in decisions and records', () => {
    const state = buildSeedState();
    const episode = state.episodes.find((candidate) => candidate.id === 'ep-hist-01')!;
    const editedGuidance = SIMULATED_CARE_PLAN_VARIANTS[1];
    episode.decisions[0] = { ...episode.decisions[0]!, guidance: editedGuidance, guidanceEdited: true };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    render(<StoreProvider><MemoryRouter initialEntries={['/patient/records/ep-hist-01']}><ReviewerDecisionPanel episodeId={episode.id} /><Routes><Route path="/patient/records/:episodeId" element={<RecordDetailPage />} /></Routes></MemoryRouter></StoreProvider>);

    expect(screen.getAllByText(editedGuidance)).toHaveLength(2);
    expect(screen.queryByText(REVIEWER_APPROVED_GUIDANCE)).not.toBeInTheDocument();
  });
});

describe('selection validation accessibility', () => {
  it('associates an intake quick-reply group with its required-choice error', () => {
    render(<QuickReplyGroup legend="Choose a demo option" options={[{ value: 'one', label: 'One' }]} value={null} onChange={() => undefined} error="Choose an option to continue." />);

    const group = screen.getByRole('group', { name: 'Choose a demo option' });
    const error = screen.getByRole('alert');
    expect(group).toHaveAttribute('aria-describedby', error.id);
  });

  it('associates a rejected care-plan choice with its select, not the review note', () => {
    const state = buildSeedState();
    const episode = state.episodes.find((candidate) => candidate.id === 'ep-routine-01')!;
    episode.status = 'in_doctor_review';
    state.role = 'doctor';
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    renderWithStore(<DecisionForm episodeId={episode.id} />);
    fireEvent.change(screen.getByLabelText(/Edit simulated care-plan variant/), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save sample doctor decision' }));

    const guidance = screen.getByLabelText(/Edit simulated care-plan variant/);
    const error = screen.getByRole('alert');
    expect(guidance).toHaveAttribute('aria-describedby', error.id);
    expect(screen.getByRole('textbox', { name: /Review note \/ reason/ })).not.toHaveAttribute('aria-describedby');
  });
});

describe('component accessibility', () => {
  it('two text areas with errors get distinct linked error ids', () => {
    render(<><TextArea label="First" value="" onChange={() => undefined} error="First error" /><TextArea label="Second" value="" onChange={() => undefined} error="Second error" /></>);
    const first = screen.getByRole('textbox', { name: 'First' });
    const second = screen.getByRole('textbox', { name: 'Second' });
    const [firstError, secondError] = screen.getAllByRole('alert');
    expect(firstError!.id).not.toBe(secondError!.id);
    expect(first).toHaveAttribute('aria-describedby', firstError!.id);
    expect(second).toHaveAttribute('aria-describedby', secondError!.id);
  });

  it('ConfirmDialog focuses Cancel and closes on Escape', () => {
    const Harness = () => { const [open, setOpen] = useState(true); return <ConfirmDialog open={open} title="Reset demo data?" onCancel={() => setOpen(false)} onConfirm={() => setOpen(false)}>Body</ConfirmDialog>; };
    render(<Harness />);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Tabs move selection with arrow keys', () => {
    const Harness = () => { const [value, setValue] = useState<'a' | 'b' | 'c'>('a'); return <Tabs label="Demo tabs" tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }]} value={value} onChange={setValue}><p>Panel {value}</p></Tabs>; };
    render(<Harness />);
    const tabA = screen.getByRole('tab', { name: 'A' });
    tabA.focus();
    fireEvent.keyDown(tabA, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'B' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'B' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'B' }), { key: 'End' });
    expect(screen.getByRole('tab', { name: 'C' })).toHaveAttribute('aria-selected', 'true');
    fireEvent.keyDown(screen.getByRole('tab', { name: 'C' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'A' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Panel a');
  });
});
