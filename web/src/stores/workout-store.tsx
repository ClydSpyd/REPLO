import { create } from 'zustand';
import workoutSessionSkeleton from '../assets/dummy_data/workout';

const getWorkoutTotals = (workout: WorkoutSession) => {
  const totalSets = workout.exercises.reduce(
    (acc, exercise) => acc + exercise.sets.length,
    0,
  );
  const completedSets = workout.exercises.reduce(
    (acc, exercise) =>
      acc + exercise.sets.filter((set) => set.completed).length,
    0,
  );

  return { totalSets, completedSets };
};

interface WorkoutStore {
  currentWorkout: WorkoutSession;
  setCurrentWorkout: (workout: WorkoutSession) => void;
  updateCurrentWorkout: (updatedWorkout: Partial<WorkoutSession>) => void;
  toggleSetCompletion: (exerciseIndex: number, setIndex: number) => void;
  totalSets: number;
  completedSets: number;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  currentWorkout: workoutSessionSkeleton,
  ...getWorkoutTotals(workoutSessionSkeleton),
  setCurrentWorkout: (workout) =>
    set({ currentWorkout: workout, ...getWorkoutTotals(workout) }),

  updateCurrentWorkout: (updatedWorkout: Partial<WorkoutSession>) => {
    const current = get().currentWorkout;
    if (current) {
      const nextWorkout = { ...current, ...updatedWorkout };
      set({ currentWorkout: nextWorkout, ...getWorkoutTotals(nextWorkout) });
    }
  },

  toggleSetCompletion: (exerciseIndex: number, setIndex: number) => {
    const current = get().currentWorkout;
    if (current) {
      const updatedExercises = [...current.exercises];
      const targetSet = updatedExercises[exerciseIndex].sets[setIndex];
      if (targetSet) {
        targetSet.completed = !targetSet.completed;
        const nextWorkout = {
          ...current,
          exercises: updatedExercises,
        };
        set({
          currentWorkout: nextWorkout,
          ...getWorkoutTotals(nextWorkout),
        });
      }
    }
  },
}));
