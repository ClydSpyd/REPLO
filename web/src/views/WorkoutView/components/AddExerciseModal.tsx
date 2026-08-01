import { useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import ExerciseDatasetList from '../../../components/exercise-dataset-list';
import ExerciseFiltersBar from '../../../components/exercise-filters-bar';
import type { PrimaryMuscleGroup } from '../../../config/muscles';
import { useAddExerciseToCurrentWorkout } from '../../../mutations/workouts';

export default function AddExerciseModal({
  onClose,
}: {
  onClose: () => void;
  toggleOpen?: (val: boolean) => void;
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

  const { mutate: addExerciseToWorkout } = useAddExerciseToCurrentWorkout();

  const handleExerciseSelect = (exercise: ExerciseMinimal) => {
    addExerciseToWorkout(
      { exerciseId: exercise.id },
      {
        onSuccess: () => {
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      subHeading="Add Exercise"
      mainHeading="Build your session"
      description="Search the library and drop any lift into today's workout."
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
        />
      </div>
    </Modal>
  );
}
