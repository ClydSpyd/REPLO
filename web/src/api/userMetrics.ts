import type {
  MetricsPeriod,
  MuscleBalance,
  PersonalBest,
  VolumeAnalysis,
} from '@replo/shared';
import { baseClient } from '.';

export const userMetricsMethods = {
  getPersonalBests: async () => {
    const { data } = await baseClient.get<PersonalBest[]>(
      '/userMetrics/personal-bests',
    );
    return data;
  },
  getVolume: async (period: MetricsPeriod) => {
    const { data } = await baseClient.get<VolumeAnalysis>(
      '/userMetrics/volume',
      { params: { period } },
    );
    return data;
  },
  getMuscleBalance: async (period: MetricsPeriod) => {
    const { data } = await baseClient.get<MuscleBalance>(
      '/userMetrics/muscle-balance',
      { params: { period } },
    );
    return data;
  },
};
