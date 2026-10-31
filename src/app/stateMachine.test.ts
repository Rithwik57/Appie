import { buildSeedState } from '../data/seed';
import { applyAction } from './stateMachine';
import { REVIEWER_APPROVED_GUIDANCE, SIMULATED_CARE_PLAN_VARIANTS } from '../domain/copy';
import type { Action } from './actions';
import { defaultCtx } from './ctx';
import type { AppState, Role } from '../domain/types';

const unwrap = (result: ReturnType<typeof applyAction>) => { if (!result.ok) throw new Error(result.error.message); return result.state; };
const as = (state: AppState, role: Role) => unwrap(applyAction(state, { type: 'SWITCH_ROLE', role }));
const episodeOf = (state: AppState, id: string) => state.episodes.find((episode) => episode.id === id)!;

/** Doctor approve → pharmacist confirm, leaving the routine case ready for checkout. */
const toReadyForCheckout = (start: AppState = buildSeedState()) => {
  let state = as(start, 'doctor');
  state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
  state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' }));
  state = as(state, 'pharmacist');
  return unwrap(applyAction(state, { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' }));
};
const toPaid = () => unwrap(applyAction(as(toReadyForCheckout(), 'patient'), { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' }));

describe('applyAction safety gates', () => {
  it('requires doctor then pharmacist before payment', () => {
    let state = as(buildSeedState(), 'patient');
    expect(applyAction(state, { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' }).ok).toBe(false);
    state = as(state, 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' }));
    expect(episodeOf(state, 'ep-routine-01').status).toBe('awaiting_pharmacist_check');
    state = as(state, 'patient');
    expect(applyAction(state, { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' })).toMatchObject({ ok: false, error: { code: 'ILLEGAL_TRANSITION' } });
    state = as(state, 'pharmacist');
    state = unwrap(applyAction(state, { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' }));
    state = as(state, 'patient');
    const result = applyAction(state, { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(episodeOf(result.state, 'ep-routine-01').status).toBe('order_placed');
  });
  it('does not permit routine actions from an urgent episode', () => {
    const state = as(buildSeedState(), 'patient'); const before = episodeOf(state, 'ep-urgent-01');
    const result = applyAction(state, { type: 'PAY', episodeId: before.id, method: 'upi' });
    expect(result).toMatchObject({ ok: false });
    expect(episodeOf(state, before.id)).toBe(before);
  });
  it('rejects arbitrary doctor guidance outside the safe simulated placeholder', () => {
    let state = as(buildSeedState(), 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    const result = applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: 'Take an unreviewed clinical action.', note: 'Sample doctor review note.' });
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED', fieldErrors: { guidance: expect.any(String) } } });
    expect(episodeOf(state, 'ep-routine-01').status).toBe('in_doctor_review');
  });
  it('records an allowlisted edited simulated care-plan variant in the decision and audit history', () => {
    let state = as(buildSeedState(), 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    const guidance = SIMULATED_CARE_PLAN_VARIANTS[1];
    const result = applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance, note: 'Selected the follow-up demonstration variant.' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(episodeOf(result.state, 'ep-routine-01').decisions.at(-1)).toMatchObject({ guidance, guidanceEdited: true });
    expect(result.state.audit.at(-1)).toMatchObject({ action: 'approve_with_prescription', detail: expect.stringContaining(guidance) });
  });
  it('records seeded consent, intake, assessment, and urgent escalation audit events when loading a scenario', () => {
    const result = applyAction(buildSeedState(), { type: 'LOAD_SCENARIO', scenario: 'urgent' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const entries = result.state.audit.filter((entry) => entry.episodeId === result.episodeId).map((entry) => entry.action);
    expect(entries).toEqual(['consent_accepted', 'intake_submitted', 'ai_summary_created', 'patient_escalated']);
  });
});

describe('demo session', () => {
  it('rejects every episode action while signed out', () => {
    const state = buildSeedState();
    expect(state.role).toBeNull();
    const actions: Action[] = [
      { type: 'START_EPISODE' },
      { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
      { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' },
      { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' },
      { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-hist-01', to: 'delivered' },
      { type: 'REQUEST_TELECONSULT', episodeId: 'ep-routine-01', note: '' },
    ];
    for (const action of actions) expect(applyAction(state, action), action.type).toMatchObject({ ok: false, error: { code: 'ROLE_NOT_PERMITTED' } });
  });
  it('SIGN_OUT clears only the role', () => {
    const state = toReadyForCheckout();
    const signedOut = unwrap(applyAction(state, { type: 'SIGN_OUT' }));
    expect(signedOut.role).toBeNull();
    expect(signedOut.episodes).toBe(state.episodes);
    expect(signedOut.audit).toBe(state.audit);
  });
  it('RESET_DEMO restores seed episodes and audit but keeps the session role', () => {
    const changed = toReadyForCheckout();
    const reset = unwrap(applyAction(changed, { type: 'RESET_DEMO' }));
    const seed = buildSeedState();
    expect(reset.role).toBe('pharmacist');
    expect(reset.episodes).toEqual(seed.episodes);
    expect(reset.audit).toEqual(seed.audit);
    expect(reset.idCounters).toEqual(seed.idCounters);
  });
  it('rejects an unknown role on SWITCH_ROLE', () => {
    expect(applyAction(buildSeedState(), { type: 'SWITCH_ROLE', role: 'caregiver' as Role })).toMatchObject({ ok: false, error: { code: 'VALIDATION_FAILED' } });
  });
});

describe('operations fulfillment transitions', () => {
  it('operations cannot advance an order before payment', () => {
    let state = as(buildSeedState(), 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' }));
    expect(applyAction(as(state, 'ops'), { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' })).toMatchObject({ ok: false, error: { code: 'ROUTINE_BLOCKED' } });
    const ready = as(toReadyForCheckout(), 'ops');
    expect(applyAction(ready, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' })).toMatchObject({ ok: false, error: { code: 'ROUTINE_BLOCKED' } });
    expect(applyAction(ready, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-unclear-01', to: 'preparing' })).toMatchObject({ ok: false, error: { code: 'ROUTINE_BLOCKED' } });
  });
  it('patient, doctor and pharmacist cannot advance fulfillment', () => {
    const paid = toPaid();
    for (const role of ['patient', 'doctor', 'pharmacist'] as const) {
      expect(applyAction(as(paid, role), { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' }), role).toMatchObject({ ok: false, error: { code: 'ROLE_NOT_PERMITTED' } });
    }
  });
  it('operations cannot review, decide, check or pay', () => {
    const ops = as(buildSeedState(), 'ops');
    const actions: Action[] = [
      { type: 'START_REVIEW', episodeId: 'ep-routine-01' },
      { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' },
      { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' },
      { type: 'PHARMACIST_FLAG', episodeId: 'ep-routine-01', reason: 'An operations attempt to flag.' },
      { type: 'PAY', episodeId: 'ep-routine-01', method: 'upi' },
      { type: 'START_EPISODE' },
    ];
    for (const action of actions) expect(applyAction(ops, action), action.type).toMatchObject({ ok: false, error: { code: 'ROLE_NOT_PERMITTED' } });
  });
  it('urgent episode with a forged order is still blocked', () => {
    const state = as(buildSeedState(), 'ops');
    const hist = episodeOf(state, 'ep-hist-01');
    const forged: AppState = { ...state, episodes: state.episodes.map((episode) => episode.id === 'ep-urgent-01' ? { ...hist, id: 'ep-urgent-01', status: 'order_placed', escalatedAt: '2025-01-15T08:15:00+05:30', tracking: { current: 'order_placed', events: [{ status: 'order_placed', at: '2025-01-15T08:20:00+05:30' }] } } : episode) };
    expect(applyAction(forged, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-urgent-01', to: 'preparing' })).toMatchObject({ ok: false, error: { code: 'ROUTINE_BLOCKED' } });
  });
  it('a stale target status is rejected and does not skip a stage', () => {
    const ops = as(toPaid(), 'ops');
    expect(applyAction(ops, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'dispatched' })).toMatchObject({ ok: false, error: { code: 'ILLEGAL_TRANSITION' } });
    const once = unwrap(applyAction(ops, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' }));
    expect(applyAction(once, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' })).toMatchObject({ ok: false, error: { code: 'ILLEGAL_TRANSITION', message: expect.stringContaining('already updated') } });
    expect(episodeOf(once, 'ep-routine-01').tracking?.current).toBe('preparing');
  });
  it('rejects updates to an already delivered order', () => {
    const ops = as(buildSeedState(), 'ops');
    expect(applyAction(ops, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-hist-01', to: 'delivered' })).toMatchObject({ ok: false, error: { code: 'ALREADY_DELIVERED' } });
  });
  it('each operations update is audited with the ops role, name and time', () => {
    const ops = as(toPaid(), 'ops');
    const at = '2025-01-16T10:00:00+05:30';
    const ctxResult = applyAction(ops, { type: 'ADVANCE_FULFILLMENT', episodeId: 'ep-routine-01', to: 'preparing' }, { now: () => at, services: defaultCtx.services });
    const next = unwrap(ctxResult);
    expect(next.audit.at(-1)).toMatchObject({ episodeId: 'ep-routine-01', action: 'delivery_status_changed', actorRole: 'ops', actorName: ops.operator.displayName, at, detail: 'Fulfillment status updated to Preparing (simulated).' });
    expect(episodeOf(next, 'ep-routine-01').tracking?.events.at(-1)).toEqual({ status: 'preparing', at });
    expect(episodeOf(next, 'ep-routine-01').status).toBe('preparing');
  });
});
