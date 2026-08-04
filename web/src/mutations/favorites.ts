import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../api';
import { FAVORITES_KEY } from '../queries/favorites';

/**
 * Toggle a routine's favorite state. Optimistically flips the cached
 * ['favorites'] id list so the star responds instantly, rolling back if the
 * request fails and reconciling with the server on settle.
 */
export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      routineId,
      isFavorite,
    }: {
      routineId: string;
      /** The routine's favorite state BEFORE the toggle. */
      isFavorite: boolean;
    }) => {
      if (isFavorite) {
        await API.favorite.removeFavorite(routineId);
      } else {
        await API.favorite.addFavorite(routineId);
      }
    },

    onMutate: async ({ routineId, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<string[]>(FAVORITES_KEY);

      queryClient.setQueryData<string[]>(FAVORITES_KEY, (ids = []) =>
        isFavorite
          ? ids.filter((id) => id !== routineId)
          : [...ids, routineId],
      );

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });
};
