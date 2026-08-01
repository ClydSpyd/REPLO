import { baseClient } from '.';

export const workoutMethods = {
  getWorkoutById: async (workoutId: string) => {
    const { data } = await baseClient.get<WorkoutSession>(
      `/workout/${workoutId}`,
    );
    return data;
  },
  getMyActiveWorkout: async () => {
    const { data } = await baseClient.get<WorkoutSession | null>(
      '/workout/active',
    );
    return data;
  },
  createWorkout: async (workoutData: Partial<WorkoutSession>) => {
    const { data } = await baseClient.post<WorkoutSession>(
      '/workout',
      workoutData,
    );
    return data;
  },
  updateWorkout: async (
    workoutId: string,
    updatedData: Partial<WorkoutSession>,
  ) => {
    const { data } = await baseClient.patch<WorkoutSession>(
      `/workout/${workoutId}`,
      updatedData,
    );
    return data;
  },
  startWorkout: async (workoutId: string) => {
    const { data } = await baseClient.patch<WorkoutSession>(
      `/workout/${workoutId}`,
      {
        started: new Date().toISOString(),
      },
    );
    return data;
  },
  endWorkout: async (workoutId: string) => {
    const { data } = await baseClient.patch<WorkoutSession>(
      `/workout/${workoutId}`,
      {
        ended: new Date().toISOString(),
      },
    );
    return data;
  },
  deleteWorkout: async (workoutId: string) => {
    const { data } = await baseClient.delete<{ message: string }>(
      `/workout/${workoutId}`,
    );
    return data;
  },
  addExerciseToWorkout: async (exerciseId: string, workoutId: string) => {
    const { data } = await baseClient.post<WorkoutSession>(
      `/workout/${workoutId}/exercise`,
      {
        exerciseId,
        sets: [],
      },
    );
    return data;
  },
  removeExerciseFromWorkout: async (exerciseId: string, workoutId: string) => {
    const { data } = await baseClient.delete<WorkoutSession>(
      `/workout/${workoutId}/exercise`,
      {
        data: {
          exerciseId,
        },
      },
    );
    return data;
  },
  replaceExercise: async (
    workoutId: string,
    fromExerciseId: string,
    toExerciseId: string,
  ) => {
    const { data } = await baseClient.patch<WorkoutSession>(
      `/workout/${workoutId}/exercise/replace`,
      {
        fromExerciseId,
        toExerciseId,
      },
    );
    return data;
  },
  addSetToExercise: async (
    workoutId: string,
    exerciseId: string,
    setData: WorkoutSetInput,
  ) => {
    const { data } = await baseClient.post<WorkoutSession>(
      `/workout/${workoutId}/set`,
      {
        exerciseId,
        setData,
      },
    );
    return data;
  },
  deleteSetFromExercise: async (
    workoutId: string,
    exerciseId: string,
    setIndex: number,
  ) => {
    const { data } = await baseClient.delete<WorkoutSession>(
      `/workout/${workoutId}/set/${setIndex}`,
      {
        data: {
          exerciseId,
        },
      },
    );
    return data;
  },
  updateSetInExercise: async (
    workoutId: string,
    exerciseId: string,
    setData: Partial<WorkoutSetInput>,
    setIndex: number,
  ) => {
    const { data } = await baseClient.patch<WorkoutSession>(
      `/workout/${workoutId}/set/${setIndex}`,
      {
        exerciseId,
        setData,
      },
    );
    return data;
  },
};
