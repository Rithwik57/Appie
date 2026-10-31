import { buildSeedState } from '../data/seed';
import { selectDemoIdentity, selectEpisodeByOrderId, selectRecords } from './selectors';
describe('application selectors', () => {
  it('projects local health records', () => expect(selectRecords(buildSeedState())).toHaveLength(4));
  it('returns exactly one seeded identity per role', () => {
    const state = buildSeedState();
    expect(selectDemoIdentity(state, 'patient')).toMatchObject({ id: 'pat-demo-01', displayName: 'Aarav (demo)' });
    expect(selectDemoIdentity(state, 'doctor')).toMatchObject({ id: 'rev-doc-01' });
    expect(selectDemoIdentity(state, 'pharmacist')).toMatchObject({ id: 'rev-pha-01' });
    expect(selectDemoIdentity(state, 'ops')).toMatchObject({ id: 'ops-demo-01' });
  });
  it('resolves an order ID to the episode that owns it', () => {
    const state = buildSeedState();
    expect(selectEpisodeByOrderId(state, 'SIM-ORD-0001')).toBe(state.episodes.find((episode) => episode.id === 'ep-hist-01'));
    expect(selectEpisodeByOrderId(state, 'SIM-ORD-9999')).toBeNull();
  });
});
