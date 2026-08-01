import { useQuery } from '@tanstack/react-query';
import { API } from '../api';
import type { AxiosError } from 'axios';

export const useExerciseDataset = () => {
  return useQuery<ExerciseMinimal[], Error>({
    queryKey: ['exerciseDataset'],
    queryFn: async () => {
      try {
        const res: ExerciseMinimal[] = await API.exercise.getMinimalDataset();
        console.log('Fetched exercise dataset:', res);
        return res;
      } catch (error) {
        const axiosError = error as AxiosError<{ error: string }>;

        console.error('Error fetching exercise dataset:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.error || axiosError.message,
          error,
        });

        throw new Error(axiosError.response?.data?.error || axiosError.message);
      }
    },
    retry: 3,
    staleTime: Infinity, // indefinite
    refetchOnWindowFocus: false,
    enabled: true,
  });
};
