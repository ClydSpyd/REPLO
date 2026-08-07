import type {
  MetricsPeriod,
  MuscleBalance,
  PersonalBest,
  VolumeAnalysis,
  VolumeTrend,
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
  getVolumeTrend: async () => {
    const { data } = await baseClient.get<VolumeTrend>(
      '/userMetrics/volume-trend',
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
