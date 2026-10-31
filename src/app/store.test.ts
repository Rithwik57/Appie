import { buildSeedState } from '../data/seed';
import { loadState, STORAGE_KEY } from '../data/persistence';
import { createStore } from './store';

beforeEach(() => window.localStorage.clear());

describe('store', () => {
  it('persists accepted state changes', () => {
    const store = createStore(buildSeedState());
    const result = store.dispatch({ type: 'SWITCH_ROLE', role: 'doctor' });
    expect(result.ok).toBe(true);
    expect(store.getState().role).toBe('doctor');
    expect(loadState().state.role).toBe('doctor');
  });
  it('store.reset restores seed and saves it', () => {
    const store = createStore(buildSeedState());
    store.dispatch({ type: 'SWITCH_ROLE', role: 'patient' });
    store.dispatch({ type: 'START_EPISODE' });
    expect(store.getState().episodes).toHaveLength(5);
    store.reset();
    expect(store.getState().episodes).toEqual(buildSeedState().episodes);
    expect(store.getState().role).toBe('patient');
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof buildSeedState>;
    expect(saved.episodes).toHaveLength(4);
  });
  it('SIGN_OUT persists role null', () => {
    const store = createStore(buildSeedState());
    store.dispatch({ type: 'SWITCH_ROLE', role: 'ops' });
    store.dispatch({ type: 'SIGN_OUT' });
    expect(loadState().state.role).toBeNull();
  });
});
