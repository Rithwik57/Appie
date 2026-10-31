import { buildSeedState } from '../data/seed';
import { deriveTimeline } from './timeline';

describe('timeline', () => {
  it('marks routine fulfillment blocked for urgent episodes', () => {
    const episode = buildSeedState().episodes.find((candidate) => candidate.id === 'ep-urgent-01')!;
    expect(deriveTimeline(episode, []).find((step) => step.key === 'payment')?.state).toBe('blocked');
  });

  it('keeps every illustrative delivery event and timestamp in the patient timeline data', () => {
    const state = buildSeedState();
    const episode = state.episodes.find((candidate) => candidate.id === 'ep-hist-01')!;
    const delivery = deriveTimeline(episode, state.audit.filter((entry) => entry.episodeId === episode.id)).find((step) => step.key === 'delivery')!;
    expect(delivery.detail).toContain('Delivered');
    expect(delivery.at).toBe('2024-12-25T16:00:00+05:30');
    expect(delivery.events).toHaveLength(5);
    expect(delivery.events?.at(-1)?.detail).toContain('Delivered');
  });
});
