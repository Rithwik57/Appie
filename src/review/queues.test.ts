import { buildSeedState } from '../data/seed';
import { applyAction } from '../app/stateMachine';
import { selectEpisodeByOrderId, selectRecords } from '../app/selectors';
import { REVIEWER_APPROVED_GUIDANCE } from '../domain/copy';
import type { AppState, Role } from '../domain/types';
import { selectDoctorQueue, type DoctorQueueTab } from './doctorQueue';
import { selectOperationsQueue } from './operationsQueue';
import { selectPharmacistQueue, type PharmacistQueueTab } from './pharmacistQueue';

const unwrap = (result: ReturnType<typeof applyAction>) => { if (!result.ok) throw new Error(result.error.message); return result.state; };
const as = (state: AppState, role: Role) => unwrap(applyAction(state, { type: 'SWITCH_ROLE', role }));
const ids = (items: { episode: { id: string } }[]) => items.map((item) => item.episode.id);
const pharmacistAll = (state: AppState) => (['awaiting', 'flagged', 'completed'] as PharmacistQueueTab[]).flatMap((tab) => ids(selectPharmacistQueue(state, tab)));
const opsAll = (state: AppState) => [...ids(selectOperationsQueue(state, 'active')), ...ids(selectOperationsQueue(state, 'delivered'))];

const approve = (state: AppState) => {
  let next = as(state, 'doctor');
  next = unwrap(applyAction(next, { type: 'START_REVIEW', episodeId: 'ep-routine-01' }));
  return unwrap(applyAction(next, { type: 'DOCTOR_DECIDE', episodeId: 'ep-routine-01', decision: 'approve_with_prescription', guidance: REVIEWER_APPROVED_GUIDANCE, note: '' }));
};

describe('role queues', () => {
  it('seed: doctor, pharmacist and operations queues start in the expected state', () => {
    const state = buildSeedState();
    expect(ids(selectDoctorQueue(state, 'pending')).sort()).toEqual(['ep-routine-01', 'ep-unclear-01']);
    expect(ids(selectDoctorQueue(state, 'escalated'))).toEqual(['ep-urgent-01']);
    expect(selectPharmacistQueue(state, 'awaiting')).toHaveLength(0);
    expect(selectOperationsQueue(state, 'active')).toHaveLength(0);
    expect(ids(selectOperationsQueue(state, 'delivered'))).toEqual(['ep-hist-01']);
  });
  it('doctor approval moves the routine case to the pharmacist only', () => {
    const state = approve(buildSeedState());
    expect(ids(selectPharmacistQueue(state, 'awaiting'))).toEqual(['ep-routine-01']);
    expect(opsAll(state)).not.toContain('ep-routine-01');
  });
  it('pharmacist confirmation leaves the pharmacist queue but does not reach operations before payment', () => {
    const state = unwrap(applyAction(as(approve(buildSeedState()), 'pharmacist'), { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' }));
    expect(ids(selectPharmacistQueue(state, 'awaiting'))).not.toContain('ep-routine-01');
    expect(ids(selectPharmacistQueue(state, 'completed'))).toContain('ep-routine-01');
    expect(opsAll(state)).not.toContain('ep-routine-01');
  });
  it('payment puts the same order in the operations queue, records and order lookup', () => {
    let state = unwrap(applyAction(as(approve(buildSeedState()), 'pharmacist'), { type: 'PHARMACIST_CONFIRM', episodeId: 'ep-routine-01' }));
    state = unwrap(applyAction(as(state, 'patient'), { type: 'PAY', episodeId: 'ep-routine-01', method: 'card' }));
    const [item] = selectOperationsQueue(state, 'active');
    expect(item).toMatchObject({ nextStatus: 'preparing', statusLabel: 'Order received' });
    const episode = selectEpisodeByOrderId(state, item!.order.id)!;
    expect(episode).toBe(item!.episode);
    expect(episode.order).toBe(item!.order);
    expect(selectRecords(state).find((record) => record.episodeId === episode.id)?.orderStatusLabel).toBe('Order received');
  });
  it('urgent and unclear episodes never appear in pharmacist or operations queues', () => {
    let state = buildSeedState();
    const check = () => {
      for (const id of ['ep-urgent-01', 'ep-unclear-01']) {
        expect(pharmacistAll(state)).not.toContain(id);
        expect(opsAll(state)).not.toContain(id);
      }
    };
    check();
    state = as(state, 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-unclear-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-unclear-01', decision: 'request_more_info', guidance: null, note: 'Please add more sample context.' }));
    check();
    state = unwrap(applyAction(as(state, 'patient'), { type: 'ANSWER_MORE_INFO', episodeId: 'ep-unclear-01', response: 'More fictional context.' }));
    state = unwrap(applyAction(state, { type: 'REQUEST_TELECONSULT', episodeId: 'ep-urgent-01', note: '' }));
    state = as(state, 'doctor');
    state = unwrap(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-unclear-01' }));
    state = unwrap(applyAction(state, { type: 'DOCTOR_DECIDE', episodeId: 'ep-unclear-01', decision: 'route_teleconsult', guidance: null, note: 'Routing to a sample teleconsultation.' }));
    check();
    expect(applyAction(state, { type: 'START_REVIEW', episodeId: 'ep-urgent-01' }).ok).toBe(false);
    check();
  });
  it('a pharmacist flag moves the episode to the pharmacist flagged tab and doctor pending tab', () => {
    const state = unwrap(applyAction(as(approve(buildSeedState()), 'pharmacist'), { type: 'PHARMACIST_FLAG', episodeId: 'ep-routine-01', reason: 'Please re-check the demo item.' }));
    expect(ids(selectPharmacistQueue(state, 'flagged'))).toEqual(['ep-routine-01']);
    expect(ids(selectPharmacistQueue(state, 'awaiting'))).toHaveLength(0);
    const doctorTabs: DoctorQueueTab[] = ['pending'];
    expect(ids(selectDoctorQueue(state, doctorTabs[0]!))).toContain('ep-routine-01');
  });
});
