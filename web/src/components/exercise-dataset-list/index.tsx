import {
  matchesMuscleGroup,
  type Equipment,
  type PrimaryMuscleGroup,
} from '../../config/muscles';
import { useCallback, useEffect, useState } from 'react';
import { FiCheck, FiPlus } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import { useExerciseDataset } from '../../queries/exercises';

interface Props {
  onSelect(exercise: ExerciseMinimal): void;
  /** Label for the per-row action button. Defaults to "Add". */
  selectLabel?: string;
  /**
   * `label` (default) renders a text button; `icon` renders a compact square
   * that shows + when unselected and a tick once the row is selected.
   */
  actionVariant?: 'label' | 'icon';
  /** Exercise ids already chosen — rendered as selected. */
  selectedIds?: string[];
  /** Notified with the number of rows matching the current filters. */
  onResultCount?: (count: number) => void;
  filterInput?: {
    name?: string;
    primaryMuscleGroup?: PrimaryMuscleGroup;
    /** Matched as a substring, so "cable" catches "cable-machine". */
    equipment?: Equipment | string[];
  };
}

export default function ExerciseDatasetList(props: Props) {
  const {
    data: exercises = [],
    isLoading,
    isError,
    error,
  } = useExerciseDataset();

  const [filteredExercises, setFilteredExercises] =
    useState<ExerciseMinimal[]>(exercises);

  const applyFilters = useCallback(
    (filterInput?: Props['filterInput']) => {
      const normalizedName = filterInput?.name?.trim().toLowerCase();
      const normalizedMuscle = filterInput?.primaryMuscleGroup
        ?.trim()
        .toLowerCase();
      // Accepts a single value or a set of aliases; matched as substrings so a
      // coarse bucket like "cable" catches "cable-machine".
      const equipmentTerms = (
        Array.isArray(filterInput?.equipment)
          ? filterInput.equipment
          : filterInput?.equipment
            ? [filterInput.equipment]
            : []
      ).map((term) => term.trim().toLowerCase());

      const hasActiveFilters =
        Boolean(normalizedName) ||
        Boolean(normalizedMuscle) ||
        equipmentTerms.length > 0;

      if (!hasActiveFilters) {
        setFilteredExercises(exercises);
        return;
      }

      const nextFilteredExercises = exercises.filter((exercise) => {
        const nameMatches =
          !normalizedName ||
          exercise.name.toLowerCase().includes(normalizedName) ||
          (exercise.muscleGroups ?? []).some((muscle) =>
            muscle.toLowerCase().includes(normalizedName),
          );
        // Consolidated groups expand to the specific values the dataset uses,
        // so "back" also matches upper-back, lower-back, lats, traps, …
        const muscleMatches =
          !normalizedMuscle || matchesMuscleGroup(exercise, normalizedMuscle);
        const equipmentMatches =
          equipmentTerms.length === 0 ||
          (exercise.equipment ?? []).some((equipment) =>
            equipmentTerms.some((term) =>
              equipment.toLowerCase().includes(term),
            ),
          );

        return nameMatches && muscleMatches && equipmentMatches;
      });

      setFilteredExercises(nextFilteredExercises);
    },
    [exercises],
  );

  const debouncedApplyFilters = useDebounce(applyFilters, 250);

  useEffect(() => {
    debouncedApplyFilters(props.filterInput);
  }, [debouncedApplyFilters, props.filterInput]);

  // Report the match count upward (for a "N exercises" readout). Keep the
  // callback stable in the parent, or this will loop.
  const { onResultCount } = props;
  useEffect(() => {
    onResultCount?.(filteredExercises.length);
  }, [onResultCount, filteredExercises.length]);

  const selected = new Set(props.selectedIds ?? []);
  const isIconVariant = props.actionVariant === 'icon';

  return (
    <div className="exercise-dataset-list flex flex-col gap-3">
      {isLoading && (
        <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide py-6 text-center">
          Loading exercises...
        </p>
      )}

      {isError && (
        <p className="anotation text-[var(--accent-primary)]! text-xs! uppercase tracking-wide py-6 text-center">
          Error loading exercises: {error?.message}
        </p>
      )}

      {!isLoading && !isError && filteredExercises.length === 0 && (
        <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide py-6 text-center">
          No exercises match your filters
        </p>
      )}

      {!isLoading &&
        !isError &&
        filteredExercises.length > 0 &&
        filteredExercises?.map((exercise) => (
          <div
            key={exercise.id}
            className="flex items-center justify-between gap-3 lg:gap-4 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-4 lg:px-6 lg:py-5"
          >
            <div className="min-w-0">
              <h3 className="heading-four truncate text-white">
                {exercise.name}
              </h3>
              <div className="mt-2 lg:mt-3 flex flex-wrap gap-1.5 lg:gap-2">
                {/* Equipment is secondary detail — muscle groups drive the
                    choice, so only those survive on a narrow screen. */}
                {(exercise.equipment ?? []).map((muscle) => (
                  <span
                    key={muscle}
                    className="hidden lg:inline-block rounded-full border border-[var(--contrast-one)] px-3 py-1 text-xs text-[var(--contrast-three)]"
                  >
                    {formatLabel(muscle)}
                  </span>
                ))}
                {(exercise.muscleGroups ?? []).map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-2 py-0.5 lg:px-3 lg:py-1 text-[10px] lg:text-xs whitespace-nowrap text-[var(--accent-primary)]"
                  >
                    {formatLabel(item)}
                  </span>
                ))}
              </div>
            </div>

            {isIconVariant ? (
              <button
                type="button"
                aria-label={
                  selected.has(exercise.id)
                    ? `Remove ${exercise.name}`
                    : `Add ${exercise.name}`
                }
                aria-pressed={selected.has(exercise.id)}
                onClick={() => props.onSelect(exercise)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-lg transition-colors ${
                  selected.has(exercise.id)
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-400'
                    : 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)] hover:brightness-125'
                }`}
              >
                {selected.has(exercise.id) ? <FiCheck /> : <FiPlus />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => props.onSelect(exercise)}
                className="anton shrink-0 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] px-4 py-2.5 text-sm lg:px-6 lg:py-3 lg:text-lg font-extrabold uppercase tracking-wide text-white transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
              >
                {props.selectLabel ?? 'Add'}
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

// Turn a kebab-case dataset value ("cable-machine") into a display label
// ("Cable Machine").
function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
