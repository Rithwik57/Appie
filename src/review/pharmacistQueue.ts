import { CONCERN_LABELS } from '../domain/copy';
import { isRoutineBlocked } from '../domain/predicates';
import type { AppState, Episode } from '../domain/types';

export type PharmacistQueueTab = 'awaiting' | 'flagged' | 'completed';
export interface PharmacistQueueItem { episode: Episode; concernLabel: string; approvingDoctorId: string; marker: string; }

const inTab = (episode: Episode, tab: PharmacistQueueTab): boolean => {
  if (tab === 'awaiting') return episode.status === 'awaiting_pharmacist_check';
  if (tab === 'flagged') return episode.status === 'pharmacist_flagged';
  return episode.pharmacistChecks.at(-1)?.outcome === 'confirmed' && episode.status !== 'awaiting_pharmacist_check';
};

const markerFor = (episode: Episode): string => {
  const last = episode.pharmacistChecks.at(-1);
  if (episode.status === 'awaiting_pharmacist_check') return episode.prescription!.version > 1 ? 'Re-approved after flag' : 'Awaiting check';
  if (last?.outcome === 'flagged_to_doctor') return 'Flagged to doctor';
  return 'Check confirmed';
};

/** Urgent / escalated episodes never appear in any pharmacist tab. */
export const selectPharmacistQueue = (state: AppState, tab: PharmacistQueueTab): PharmacistQueueItem[] =>
  state.episodes
    .filter((episode) => episode.prescription !== null && !isRoutineBlocked(episode) && inTab(episode, tab))
    .sort((a, b) => (tab === 'awaiting' ? a.updatedAt.localeCompare(b.updatedAt) : b.updatedAt.localeCompare(a.updatedAt)))
    .map((episode) => ({
      episode,
      concernLabel: episode.intake.concernArea === null ? 'Not yet provided' : CONCERN_LABELS[episode.intake.concernArea],
      approvingDoctorId: episode.prescription!.approvedBy,
      marker: markerFor(episode),
    }));
