import { useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import ExerciseDatasetList from '../../../components/exercise-dataset-list';
import ExerciseFiltersBar from '../../../components/exercise-filters-bar';
import type { PrimaryMuscleGroup } from '../../../config/muscles';
import { useReplaceExercise } from '../../../mutations/workouts';

/**
 * Exercise picker for swapping one exercise in the active workout for another,
 * keeping the existing sets. Mirrors AddExerciseModal but drives the replace
 * mutation instead of the add mutation.
 */
export default function SwitchExerciseModal({
  currentExercise,
  onClose,
}: {
  currentExercise: WorkoutExercise;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<PrimaryMuscleGroup | null>(
    null,
  );

  const filterInput = useMemo(
    () => ({
      name: search || undefined,
      primaryMuscleGroup: muscleGroup ?? undefined,
    }),
    [search, muscleGroup],
  );

  const { mutate: replaceExercise } = useReplaceExercise();

  const handleExerciseSelect = (exercise: ExerciseMinimal) => {
    // Selecting the same exercise is a no-op — just close.
    if (exercise.id === currentExercise.exerciseId) {
      onClose();
      return;
    }

    replaceExercise(
      {
        fromExerciseId: currentExercise.exerciseId!,
        toExerciseId: exercise.id,
        toName: exercise.name,
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <Modal
      subHeading="Switch Exercise"
      mainHeading="Swap this lift"
      description={`Pick a replacement for ${
        currentExercise.name || 'this exercise'
      }. Your logged sets stay put.`}
      onClose={onClose}
    >
      <ExerciseFiltersBar
        search={search}
        onSearchChange={setSearch}
        muscleGroup={muscleGroup}
        onMuscleGroupChange={setMuscleGroup}
      />

      {/* Results */}
      <div className="mt-6">
        <p className="space-mono mb-3 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          Exercise Library
        </p>
        <ExerciseDatasetList
          filterInput={filterInput}
          onSelect={handleExerciseSelect}
          selectLabel="Swap"
        />
      </div>
    </Modal>
  );
}
