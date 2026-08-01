import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API } from '../api';

export const useUpdateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      routineId,
      data,
    }: {
      routineId: string;
      data: Partial<Routine>;
    }) => API.routine.updateRoutine(routineId, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['routine', updated._id], updated);
      queryClient.invalidateQueries({ queryKey: ['myRoutines'] });
    },
  });
};

export const useDeleteRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routineId: string) => API.routine.deleteRoutine(routineId),
    onSuccess: (_result, routineId) => {
      queryClient.removeQueries({ queryKey: ['routine', routineId] });
      queryClient.invalidateQueries({ queryKey: ['myRoutines'] });
    },
  });
};

/** Shared key so in-flight creations can be observed from the routine grid. */
export const CREATE_ROUTINE_KEY = ['createRoutine'] as const;

export const useCreateRoutine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: CREATE_ROUTINE_KEY,
    mutationFn: (routine: RoutineInput) => API.routine.createRoutine(routine),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRoutines'] });
    },
  });
};

/**
 * Build a reusable routine template from a finished session.
 *
 * Sets are reduced to their prescription (reps × weight) — `completed` and the
 * enriched catalog metadata are session-specific and don't belong on a
 * template. Zero-rep sets are dropped: they're placeholders the lifter never
 * filled in, and the API rejects non-positive reps.
 */
export function routineFromSession(session: WorkoutSession): RoutineInput {
  return {
    name: session.name,
    tags: session.tags ?? [],
    description: session.notes || undefined,
    exercises: session.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      sets: exercise.sets
        .filter((set) => set.reps > 0)
        .map((set) => ({ reps: set.reps, weight: set.weight })),
    })) as WorkoutExercise[],
  };
}
