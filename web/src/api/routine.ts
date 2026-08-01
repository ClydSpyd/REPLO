import { baseClient } from '.';

export const routineMethods = {
  getRoutineById: async (routineId: string) => {
    const { data } = await baseClient.get<Routine>(`/routine/${routineId}`);
    return data;
  },
  getMyRoutines: async () => {
    const { data } = await baseClient.get<Routine[]>('/routine/mine');
    return data;
  },
  createRoutine: async (routineData: RoutineInput) => {
    const { data } = await baseClient.post<Routine>('/routine', routineData);
    return data;
  },
  updateRoutine: async (routineId: string, updatedData: Partial<Routine>) => {
    const { data } = await baseClient.patch<Routine>(
      `/routine/${routineId}`,
      updatedData,
    );
    return data;
  },
  deleteRoutine: async (routineId: string) => {
    const { data } = await baseClient.delete<{ message: string }>(
      `/routine/${routineId}`,
    );
    return data;
  },
};
