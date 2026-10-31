import { buildSeedState } from '../data/seed';
import { canCheckout, canTrack, canViewPrescription } from './gates';
describe('review gates', () => { it('blocks urgent routine access', () => { const episode = buildSeedState().episodes.find((candidate) => candidate.id === 'ep-urgent-01')!; expect(canCheckout(episode)).toBe(false); expect(canTrack(episode)).toBe(false); expect(canViewPrescription(episode)).toBe(false); }); });
