import { useParams } from 'react-router-dom';
import { selectEpisode } from '../../app/selectors';
import { useAppState } from '../../app/store';

/** Resolves `:episodeId` from the route to the single shared episode entity. */
export const useEpisodeFromParams = () => {
  const { episodeId } = useParams();
  const state = useAppState();
  return episodeId === undefined ? null : selectEpisode(state, episodeId);
};
