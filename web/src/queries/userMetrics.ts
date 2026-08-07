import { useQuery } from '@tanstack/react-query';
import type {
  MetricsPeriod,
  MuscleBalance,
  PersonalBest,
  VolumeAnalysis,
  VolumeTrend,
} from '@replo/shared';
import { API } from '../api';

const isAuthed = () => Boolean(localStorage.getItem('access_token'));

/** Personal bests (heaviest weight + estimated 1RM) per exercise, all-time. */
export const useUserPersonalBests = () =>
  useQuery<PersonalBest[], Error>({
    queryKey: ['userMetrics', 'personalBests'],
    queryFn: () => API.userMetrics.getPersonalBests(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: isAuthed(),
  });

/** Completed-volume series + total + trend over the previous week or month. */
export const useUserVolume = (period: MetricsPeriod) =>
  useQuery<VolumeAnalysis, Error>({
    queryKey: ['userMetrics', 'volume', period],
    queryFn: () => API.userMetrics.getVolume(period),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: isAuthed(),
  });

/** Volume trend — last 8 weeks (bars) + last 28 days (strip). */
export const useUserVolumeTrend = () =>
  useQuery<VolumeTrend, Error>({
    queryKey: ['userMetrics', 'volumeTrend'],
    queryFn: () => API.userMetrics.getVolumeTrend(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: isAuthed(),
  });

/** Muscle-balance breakdown over the previous week or month. */
export const useUserMuscleBalance = (period: MetricsPeriod) =>
  useQuery<MuscleBalance, Error>({
    queryKey: ['userMetrics', 'muscleBalance', period],
    queryFn: () => API.userMetrics.getMuscleBalance(period),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    enabled: isAuthed(),
  });
