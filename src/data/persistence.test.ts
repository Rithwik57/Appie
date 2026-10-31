import { describe, expect, it, vi } from 'vitest';
import { CONCERN_LABELS, OUTCOME_LABELS } from '../domain/copy';
import { nextId } from '../lib/ids';
import { clearState, LEGACY_STORAGE_KEYS, loadState, saveState, STORAGE_KEY } from './persistence';
import { buildSeedState } from './seed';

describe('seed data and local persistence', () => {
  it('builds four deterministic, independent sample episodes', () => {
    const first = buildSeedState();
    const second = buildSeedState();
    expect(first).toEqual(second);
    expect(first.episodes.map((episode) => episode.seedScenario)).toEqual(['routine', 'urgent', 'unclear', 'historical']);
    expect(first.episodes.find((episode) => episode.seedScenario === 'urgent')?.status).toBe('escalated_urgent');
    expect(first.episodes.find((episode) => episode.seedScenario === 'historical')?.status).toBe('delivered');
    first.episodes[0]!.intake.freeText = 'changed locally';
    expect(second.episodes[0]!.intake.freeText).not.toBe('changed locally');
  });

  it('issues collision-free deterministic identifiers without mutating counters', () => {
    const initial = buildSeedState();
    const issued = nextId(initial.idCounters, 'ep');
    expect(issued.id).toBe('ep-0001');
    expect(initial.idCounters.ep).toBeUndefined();
    const ids = [
      ...initial.episodes.map((episode) => episode.id),
      ...initial.episodes.flatMap((episode) => [episode.assessment?.id, ...episode.decisions.map((decision) => decision.id), ...episode.pharmacistChecks.map((check) => check.id), episode.prescription?.id, episode.order?.id, episode.order?.paymentRef].filter((id): id is string => id !== undefined)),
      ...initial.audit.map((entry) => entry.id),
      issued.id,
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(initial.audit.every((entry) => initial.episodes.some((episode) => episode.id === entry.episodeId))).toBe(true);
  });

  it('round-trips valid state and safely reseeds malformed saved data', () => {
    clearState();
    const state = buildSeedState();
    expect(saveState(state)).toBe(true);
    expect(loadState()).toEqual({ state, notice: 'none' });
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const recovered = loadState();
    expect(recovered.notice).toBe('reset_corrupt');
    expect(recovered.state.episodes).toHaveLength(4);
    expect(warning).toHaveBeenCalled();
    warning.mockRestore();
  });

  it('uses shared display maps for seeded values and statuses', () => {
    const state = buildSeedState();
    for (const episode of state.episodes) {
      expect(OUTCOME_LABELS[episode.status]).toBeTruthy();
      if (episode.intake.concernArea !== null) expect(CONCERN_LABELS[episode.intake.concernArea]).toBeTruthy();
    }
  });
  it('seeds one operator identity and no selected role', () => {
    const state = buildSeedState();
    expect(state.schemaVersion).toBe(2);
    expect(state.role).toBeNull();
    expect(state.operator).toMatchObject({ id: 'ops-demo-01', role: 'ops', isSample: true });
  });
  it('persists the selected role across reload (save then load)', () => {
    clearState();
    const state = { ...buildSeedState(), role: 'pharmacist' as const };
    saveState(state);
    expect(loadState().state.role).toBe('pharmacist');
  });
  it('ignores and removes the v1 key', () => {
    clearState();
    localStorage.setItem(LEGACY_STORAGE_KEYS[0], JSON.stringify({ schemaVersion: 1, role: 'doctor', episodes: [], audit: [] }));
    const loaded = loadState();
    expect(loaded.notice).toBe('none');
    expect(loaded.state).toEqual(buildSeedState());
    expect(localStorage.getItem(LEGACY_STORAGE_KEYS[0])).toBeNull();
  });
  it('rejects a v2 state with an unknown role', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...buildSeedState(), role: 'caregiver' }));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const loaded = loadState();
    expect(loaded.notice).toBe('reset_corrupt');
    expect(loaded.state.role).toBeNull();
    warning.mockRestore();
  });
});