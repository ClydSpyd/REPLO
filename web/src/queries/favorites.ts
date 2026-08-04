import { useQuery } from '@tanstack/react-query';
import { API } from '../api';

export const FAVORITES_KEY = ['favorites'] as const;

/**
 * The routine IDs the authenticated user has favorited. `select` hands callers a
 * Set for O(1) membership checks from the routine grid.
 */
export const useFavorites = () => {
  return useQuery<string[], Error, Set<string>>({
    queryKey: FAVORITES_KEY,
    queryFn: () => API.favorite.getFavorites(),
    select: (ids) => new Set(ids),
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: Boolean(localStorage.getItem('access_token')),
  });
};
