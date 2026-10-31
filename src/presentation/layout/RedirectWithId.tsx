import { Navigate, useParams } from 'react-router-dom';

/** Redirects a legacy `:episodeId` route to its new path. */
export const RedirectWithId = ({ to }: { to: (id: string) => string }) => {
  const { episodeId = '' } = useParams();
  return <Navigate replace to={to(episodeId)} />;
};
