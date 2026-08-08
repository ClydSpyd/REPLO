import { useMemo, useState } from 'react';
import Modal from './ui/Modal';
import ExerciseDatasetList from './exercise-dataset-list';
import ExerciseFiltersBar from './exercise-filters-bar';
import type { PrimaryMuscleGroup } from '../config/muscles';

/**
 * Generic exercise library picker: search + muscle filter over the catalog,
 * calling `onSelect` with the chosen exercise. Callers decide what to do with
 * the selection (add to a workout, a draft, a routine, …).
 */
export default function ExercisePickerModal({
  onSelect,
  onClose,
  mainHeading = 'Add an exercise',
  subHeading = 'Exercise library',
  description = 'Search the library and drop any lift into this session.',
}: {
  onSelect: (exercise: ExerciseMinimal) => void;
  onClose: () => void;
  mainHeading?: string;
  subHeading?: string;
  description?: string;
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

  return (
    <Modal
      subHeading={subHeading}
      mainHeading={mainHeading}
      description={description}
      onClose={onClose}
    >
      <ExerciseFiltersBar
        search={search}
        onSearchChange={setSearch}
        muscleGroup={muscleGroup}
        onMuscleGroupChange={setMuscleGroup}
      />

      <div className="mt-6">
        <p className="space-mono mb-3 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          Exercise Library
        </p>
        <ExerciseDatasetList filterInput={filterInput} onSelect={onSelect} />
      </div>
    </Modal>
  );
}
