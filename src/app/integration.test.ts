import { buildSeedState } from '../data/seed';
import { REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import type { DeliveryStatus } from '../domain/types';
import { applyAction } from './stateMachine';
const unwrap = (result: ReturnType<typeof applyAction>) => {
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
};
const statusOf = (state: ReturnType<typeof buildSeedState>, episodeId: string) =>
  state.episodes.find((episode) => episode.id === episodeId)?.status;
describe('cross-role demo journeys', () => {
  it('completes the routine journey through operations to delivered, with a full audit trail', () => {
    let state = buildSeedState();
    const before = state.audit.length;
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'doctor' }));
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' }));
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'pharmacist' }));
    state = unwrap(applyAction(state, { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'patient' }));
    state = unwrap(applyAction(state, { type: 'PAY', episodeId: 'ep-routine-01', method: 'wallet' }));
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'ops' }));
    for (const to of ['preparing', 'dispatched', 'out_for_delivery', 'delivered'] as DeliveryStatus[]) {
      state = unwrap(applyAction(state, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to }));
    }
    expect(statusOf(state, 'ep-routine-01')).toBe('delivered');
    expect(state.episodes.find((episode) => episode.id === 'ep-routine-01')?.tracking?.events).toHaveLength(5);
    const trail = state.audit.slice(before).filter((entry) => entry.episodeId === 'ep-routine-01').map((entry) => [entry.action, entry.actorRole]);
    expect(trail).toEqual([
      ['review_started', 'doctor'],
      ['approve_with_prescription', 'doctor'],
      ['pharmacist_confirmed', 'pharmacist'],
      ['payment_simulated', 'patient'],
      ['order_created', 'system'],
      ['delivery_status_changed', 'ops'],
      ['delivery_status_changed', 'ops'],
      ['delivery_status_changed', 'ops'],
      ['delivery_status_changed', 'ops'],
    ]);
  });
  it('keeps the urgent journey paused while recording a human-help request', () => {
    let state = unwrap(applyAction(buildSeedState(), { type: 'SWITCH_ROLE', role: 'patient' }));
    state = unwrap(applyAction(state, { type: 'REQUEST_TELECONSULT', episodeId: 'ep-urgent-01', note: 'Please record sample human help.' }));
    expect(statusOf(state, 'ep-urgent-01')).toBe('escalated_urgent');
    expect(state.episodes.find((episode) => episode.id === 'ep-urgent-01')?.helpRequests).toHaveLength(1);
    expect(applyAction(state, { type: 'PAY', episodeId: 'ep-urgent-01', method: 'upi' })).toMatchObject({ ok: false });
  });
  it('returns a more-information response to the doctor queue', () => {
    let state = buildSeedState();
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'doctor' }));
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-unclear-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-unclear-01', decision: 'request_more_info', guidance: null, note: 'Please add sample context.' }));
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'patient' }));
    state = unwrap(applyAction(state, { type: 'ANSWER_MORE_INFO', episodeId: 'ep-unclear-01', response: 'Additional fictional context for the sample doctor.' }));
    expect(statusOf(state, 'ep-unclear-01')).toBe('awaiting_doctor_review');
    expect(state.episodes.find((episode) => episode.id === 'ep-unclear-01')?.moreInfo.at(-1)?.response).toContain('fictional');
  });
  it('shows a declined routine path after a doctor decision', () => {
    let state = buildSeedState();
    state = unwrap(applyAction(state, { type: 'SWITCH_ROLE', role: 'doctor' }));
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'decline_routine', guidance: null, note: 'Use in-person care in this demo.' }));
    expect(statusOf(state, 'ep-routine-01')).toBe('declined');
  });
});
