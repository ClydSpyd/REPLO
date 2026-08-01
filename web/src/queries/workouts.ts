import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { baseClient } from '../api';
import type { AxiosError, AxiosResponse } from 'axios';
import { API } from '../api';

export const useMyWorkouts = () => {
  return useQuery<WorkoutSession[], Error>({
    queryKey: ['myWorkouts'],
    queryFn: async () => {
      try {
        const res: AxiosResponse<WorkoutSession[]> =
          await baseClient.get('/workout/mine');
        console.log('Fetched workouts:', res.data);
        return res.data;
      } catch (error) {
        console.log('Error in useMyWorkouts query function:', error);
        const axiosError = error as AxiosError<{ error: string }>;

        console.error('Error fetching workouts:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.error || axiosError.message,
          error,
        });

        throw new Error(axiosError.response?.data?.error || axiosError.message);
      }
    },
    retry: 3,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: Boolean(localStorage.getItem('access_token')),
  });
};

/** Fetch a single workout by its ID — used to review a completed session. */
export const useWorkout = (workoutId?: string) => {
  return useQuery<WorkoutSession, Error>({
    queryKey: ['workout', workoutId],
    queryFn: () => API.workout.getWorkoutById(workoutId!),
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled:
      Boolean(workoutId) && Boolean(localStorage.getItem('access_token')),
  });
};

export const useMyCurrentWorkout = () => {
  return useSuspenseQuery<WorkoutSession | null, Error>({
    queryKey: ['myCurrentWorkout'],
    queryFn: async (): Promise<WorkoutSession | null> => {
      if (!localStorage.getItem('access_token')) {
        return null;
      }

      try {
        const res: WorkoutSession | null =
          await API.workout.getMyActiveWorkout();
        const currentWorkout = res ?? null;
        console.log('Fetched current workout:', currentWorkout);
        return currentWorkout;
      } catch (error) {
        console.log('Error in useMyCurrentWorkout query function:', error);
        const axiosError = error as AxiosError<{ error: string }>;

        console.error('Error fetching current workout:', {
          status: axiosError.response?.status,
          message: axiosError.response?.data?.error || axiosError.message,
          error,
        });

        throw new Error(axiosError.response?.data?.error || axiosError.message);
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};
