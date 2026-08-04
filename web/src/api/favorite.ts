import { baseClient } from '.';

export const favoriteMethods = {
  /** Routine IDs the authenticated user has favorited. */
  getFavorites: async () => {
    const { data } = await baseClient.get<string[]>('/favorite');
    return data;
  },
  addFavorite: async (routineId: string) => {
    const { data } = await baseClient.post<{ routine: string }>('/favorite', {
      routine: routineId,
    });
    return data;
  },
  removeFavorite: async (routineId: string) => {
    await baseClient.delete(`/favorite/${routineId}`);
  },
};
