import { act, fireEvent, screen, within } from '@testing-library/react';
import { paidRoutineState, renderApp, savedState, withRole } from '../test/renderApp';

beforeEach(() => window.localStorage.clear());

const orderIdOf = () => paidRoutineState().episodes.find((episode) => episode.id === 'ep-routine-01')!.order!.id;

describe('Fulfillment / Delivery Operations workspace', () => {
  it('Active tab lists exactly the paid routine order', async () => {
    const orderId = orderIdOf();
    renderApp('/operations', withRole(paidRoutineState(), 'ops'));
    const panel = await screen.findByRole('tabpanel');
    const links = within(panel).getAllByRole('link', { name: /Open order/ });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', `/operations/orders/${orderId}`);
    expect(panel).not.toHaveTextContent('ep-urgent-01');
    expect(panel).not.toHaveTextContent('ep-unclear-01');
  });

  it('advancing through the central state machine updates state and audit, through to delivered', async () => {
    const orderId = orderIdOf();
    renderApp(`/operations/orders/${orderId}`, withRole(paidRoutineState(), 'ops'));
    fireEvent.click(await screen.findByRole('button', { name: 'Mark as preparing' }));
    const routine = () => savedState().episodes.find((episode) => episode.id === 'ep-routine-01')!;
    expect(routine().tracking?.current).toBe('preparing');
    expect(savedState().audit.at(-1)).toMatchObject({ action: 'delivery_status_changed', actorRole: 'ops', episodeId: 'ep-routine-01' });
    expect(await screen.findByText('Status updated to Preparing (simulated).')).toBeInTheDocument();
    for (const label of ['Mark as dispatched', 'Mark as out for delivery', 'Mark as delivered']) fireEvent.click(screen.getByRole('button', { name: label }));
    expect(routine().status).toBe('delivered');
    expect(screen.queryByRole('button', { name: /Mark as/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Delivered (simulated). No further updates.' })).toBeInTheDocument();
  });

  it('operations updates are visible to the patient after changing role', async () => {
    const orderId = orderIdOf();
    const { router } = renderApp(`/operations/orders/${orderId}`, withRole(paidRoutineState(), 'ops'));
    for (const label of ['Mark as preparing', 'Mark as dispatched', 'Mark as out for delivery', 'Mark as delivered']) fireEvent.click(await screen.findByRole('button', { name: label }));
    await act(() => router.navigate('/operations'));
    fireEvent.click(await screen.findByRole('tab', { name: /Delivered/ }));
    expect(within(screen.getByRole('tabpanel')).getByRole('link', { name: new RegExp(orderId) })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out / Change demo role' }));
    const patientCard = screen.getByRole('heading', { level: 2, name: 'Patient' }).closest('article')!;
    fireEvent.click(within(patientCard).getByRole('button', { name: 'Continue as demo user' }));
    await act(() => router.navigate(`/patient/orders/${orderId}`));
    expect(await screen.findByRole('heading', { level: 1, name: `Order ${orderId}` })).toBeInTheDocument();
    expect(screen.getAllByText('Delivered (simulated)').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Updated by Kavya Rao \(sample\)/)).toHaveLength(4);
  });

  it('order page shows no intake, assessment or clinical controls', async () => {
    const state = paidRoutineState();
    const episode = state.episodes.find((candidate) => candidate.id === 'ep-routine-01')!;
    renderApp(`/operations/orders/${episode.order!.id}`, withRole(state, 'ops'));
    const main = await screen.findByRole('main');
    expect(main).not.toHaveTextContent(episode.intake.freeText);
    expect(main).not.toHaveTextContent(episode.assessment!.summary);
    expect(main).not.toHaveTextContent(/care-plan variant|Confirm medication|Flag to doctor|Start review/i);
    expect(within(main).getAllByRole('button').map((button) => button.textContent)).toEqual(['Mark as preparing']);
  });

  it('unknown orders show an unavailable state', async () => {
    renderApp('/operations/orders/SIM-ORD-9999', withRole(paidRoutineState(), 'ops'));
    expect(await screen.findByRole('heading', { name: 'Order unavailable' })).toBeInTheDocument();
  });
});
