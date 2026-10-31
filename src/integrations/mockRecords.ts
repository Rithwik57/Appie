import { CONCERN_LABELS, OUTCOME_LABELS } from '../domain/copy';
import type { EpisodeRecord, RecordSummary } from '../domain/types';
import { mockDelivery } from './mockDelivery';
import type { BoundaryInfo, RecordsService } from './types';

export const RECORDS_BOUNDARY: BoundaryInfo = { name: 'Local demo health records', status: 'mock', note: 'Local mock records boundary – not connected' };
export const mockRecords: RecordsService = {
  listEpisodes: (state): RecordSummary[] => state.episodes.map((episode) => ({
    episodeId: episode.id, createdAt: episode.createdAt,
    concernLabel: episode.intake.concernArea === null ? 'Not yet provided' : CONCERN_LABELS[episode.intake.concernArea],
    status: episode.status, outcomeLabel: OUTCOME_LABELS[episode.status],
    orderStatusLabel: episode.tracking === null ? null : mockDelivery.label(episode.tracking.current),
  })).sort((first, second) => second.createdAt.localeCompare(first.createdAt)),
  getEpisodeRecord: (state, id): EpisodeRecord | null => {
    const episode = state.episodes.find((candidate) => candidate.id === id);
    return episode === undefined ? null : { episode, audit: state.audit.filter((entry) => entry.episodeId === id), reviewers: state.reviewers };
  },
};
