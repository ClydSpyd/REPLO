import { useCallback, useMemo, useState } from 'react';
import {
  FiChevronDown,
  FiChevronUp,
  FiMinus,
  FiPlus,
  FiX,
} from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import ExerciseDatasetList from '../../../components/exercise-dataset-list';
import ExerciseFiltersBar from '../../../components/exercise-filters-bar';
import { useToast } from '../../../hooks/useToast';
import { estimateDurationSec } from '../../../hooks/useWorkoutSessionData';
import {
  useCreateRoutine,
  useUpdateRoutine,
} from '../../../mutations/routines';
import {
  coverageGroups,
  equipmentFilters,
  routineTags,
  type EquipmentFilter,
  type PrimaryMuscleGroup,
  type RoutineTag,
} from '../../../config/muscles';
import { formatLabel } from '../routine-utils';

/** Reps/weight aren't captured here — only how many sets each exercise gets. */
const DEFAULT_REPS = 10;
const DEFAULT_WEIGHT = 0;
const DEFAULT_SET_COUNT = 3;
const MAX_SET_COUNT = 10;

/** An exercise picked for the routine, before it's expanded into sets. */
interface DraftExercise {
  exerciseId: string;
  name: string;
  muscleGroups: string[];
  setCount: number;
  /**
   * Prescriptions carried over from an existing routine. The builder only
   * edits set *count*, so these are reused on save rather than reset to
   * defaults — editing a routine must not wipe its reps/weights.
   */
  baseSets: { reps: number; weight: number }[];
}

/** Seed the draft from a routine being edited. */
function draftFromRoutine(routine: Routine): DraftExercise[] {
  return routine.exercises.map((exercise) => ({
    exerciseId: exercise.exerciseId ?? '',
    name: exercise.name,
    muscleGroups: exercise.exerciseDetails?.muscleGroups ?? [],
    setCount: Math.max(1, exercise.sets.length),
    baseSets: exercise.sets.map((set) => ({
      reps: set.reps,
      weight: set.weight,
    })),
  }));
}

export default function RoutineBuilderModal({
  routine,
  onClose,
}: {
  /** Pass an existing routine to edit it in place; omit to create a new one. */
  routine?: Routine;
  onClose: () => void;
}) {
  const isEditing = Boolean(routine);

  const [name, setName] = useState(routine?.name ?? '');
  const [tag, setTag] = useState<RoutineTag | null>(
    (routine?.tags?.[0] as RoutineTag) ?? null,
  );
  /**
   * Once the user picks a tag themselves we stop auto-deriving it. An existing
   * routine's tag counts as deliberate, so editing never silently retags.
   */
  const [tagTouched, setTagTouched] = useState(Boolean(routine?.tags?.length));
  const [draft, setDraft] = useState<DraftExercise[]>(
    routine ? draftFromRoutine(routine) : [],
  );

  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<PrimaryMuscleGroup | null>(
    null,
  );
  const [equipment, setEquipment] = useState<EquipmentFilter | null>(null);
  const [resultCount, setResultCount] = useState<number>();

  const { success, error: toastError } = useToast();
  const { mutate: createRoutine, isPending: isCreating } = useCreateRoutine();
  const { mutate: updateRoutine, isPending: isUpdating } = useUpdateRoutine();
  const isPending = isCreating || isUpdating;

  const equipmentTerms = useMemo(
    () =>
      equipment
        ? [
            ...(equipmentFilters.find((o) => o.label === equipment)?.match ??
              []),
          ]
        : undefined,
    [equipment],
  );

  const filterInput = useMemo(
    () => ({
      name: search || undefined,
      primaryMuscleGroup: muscleGroup ?? undefined,
      equipment: equipmentTerms,
    }),
    [search, muscleGroup, equipmentTerms],
  );

  // Stable so the list's count effect doesn't loop.
  const handleResultCount = useCallback(
    (count: number) => setResultCount(count),
    [],
  );

  const selectedIds = useMemo(
    () => draft.map((entry) => entry.exerciseId),
    [draft],
  );

  const toggleExercise = (exercise: ExerciseMinimal) => {
    setDraft((current) =>
      current.some((entry) => entry.exerciseId === exercise.id)
        ? current.filter((entry) => entry.exerciseId !== exercise.id)
        : [
            ...current,
            {
              exerciseId: exercise.id,
              name: exercise.name,
              muscleGroups: exercise.muscleGroups ?? [],
              setCount: DEFAULT_SET_COUNT,
              baseSets: [],
            },
          ],
    );
  };

  const adjustSets = (exerciseId: string, delta: number) =>
    setDraft((current) =>
      current.map((entry) =>
        entry.exerciseId === exerciseId
          ? {
              ...entry,
              setCount: Math.max(1, entry.setCount + delta),
            }
          : entry,
      ),
    );

  const move = (index: number, delta: number) =>
    setDraft((current) => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  // Which coverage buckets the current selection hits.
  const activeCoverage = useMemo(() => {
    const hit = new Set(draft.flatMap((entry) => entry.muscleGroups));
    return new Set(
      coverageGroups
        .filter((group) => group.match.some((m) => hit.has(m)))
        .map((group) => group.label),
    );
  }, [draft]);

  // Suggest a tag from coverage until the user overrides it.
  const derivedTag = useMemo<RoutineTag | null>(() => {
    if (draft.length === 0) return null;
    const labels = activeCoverage;
    const lower = labels.has('Legs');
    const upperCount = ['Chest', 'Back', 'Shoulders', 'Arms'].filter((l) =>
      labels.has(l),
    ).length;

    if (lower && upperCount > 0) return 'full-body';
    if (lower) return 'legs';
    if (labels.size === 1 && labels.has('Core')) return 'core';
    if (labels.has('Back') && !labels.has('Chest')) return 'pull';
    if (labels.has('Chest') && !labels.has('Back')) return 'push';
    return 'upper';
  }, [draft.length, activeCoverage]);

  const effectiveTag = tagTouched ? tag : derivedTag;

  const setCount = draft.reduce((total, entry) => total + entry.setCount, 0);
  const estimatedMinutes = Math.ceil(
    estimateDurationSec({
      totalReps: setCount * DEFAULT_REPS,
      setCount,
      exerciseCount: draft.length,
    }) / 60,
  );

  const canSave = name.trim().length > 0 && draft.length > 0 && !isPending;

  const handleSave = () => {
    if (!canSave) return;

    const payload = {
      name: name.trim(),
      tags: effectiveTag ? [effectiveTag] : [],
      exercises: draft.map((entry) => ({
        exerciseId: entry.exerciseId,
        name: entry.name,
        // Reuse the existing prescription where there is one, extending with
        // the last set's values so growing the count doesn't reset weights.
        sets: Array.from({ length: entry.setCount }, (_, index) => {
          const carried =
            entry.baseSets[index] ?? entry.baseSets[entry.baseSets.length - 1];
          return {
            reps: carried?.reps || DEFAULT_REPS,
            weight: carried?.weight ?? DEFAULT_WEIGHT,
          };
        }),
      })) as WorkoutExercise[],
    };

    if (routine) {
      updateRoutine(
        { routineId: routine._id, data: payload },
        {
          onSuccess: (updated) => {
            success('Routine updated', updated.name);
            onClose();
          },
          onError: (err) => toastError("Couldn't update routine", err.message),
        },
      );
      return;
    }

    createRoutine(payload, {
      onSuccess: (created) => {
        success('Routine saved', created.name);
        onClose();
      },
      onError: (err) => toastError("Couldn't save routine", err.message),
    });
  };

  return (
    <Modal
      size="wide"
      subHeading={isEditing ? 'Edit' : 'Create'}
      mainHeading={isEditing ? 'Edit Routine' : 'New Routine'}
      onClose={isPending ? undefined : onClose}
      footer={
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <p className="body-text text-sm!">
            {isEditing
              ? 'Update the name, tag, exercises or set counts, then save your changes.'
              : 'Name your routine and add at least one exercise to save it to your library.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="manrope rounded-lg border border-[var(--contrast-one)] px-5 py-3 text-sm font-bold text-white transition-colors hover:border-[var(--contrast-two)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="anton rounded-lg px-6 py-3 text-lg font-extrabold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:bg-[var(--contrast-one)] disabled:text-[var(--contrast-two)] enabled:bg-[var(--accent-primary)] enabled:text-black enabled:hover:brightness-95"
            >
              {isPending
                ? 'Saving…'
                : isEditing
                  ? 'Save Changes'
                  : 'Save Routine'}
            </button>
          </div>
        </div>
      }
    >
      {/* Name + tag live above the two columns */}
      <div className="-mt-2 mb-5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your routine..."
          aria-label="Routine name"
          className="heading-three w-full border-none bg-transparent p-0 text-white placeholder:text-[var(--contrast-two)] focus:outline-none"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="space-mono mr-1 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            Tag
          </span>
          {routineTags.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setTagTouched(true);
                setTag(option === effectiveTag ? null : option);
              }}
              className={`space-mono shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                effectiveTag === option
                  ? 'bg-[var(--accent-primary)] text-black!'
                  : 'border border-[var(--contrast-one)] text-[var(--contrast-three)]! hover:text-white!'
              }`}
            >
              {formatLabel(option)}
            </button>
          ))}
          {!tagTouched && derivedTag && (
            <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-two)]">
              · Auto
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Library */}
        <div className="min-w-0">
          <ExerciseFiltersBar
            search={search}
            onSearchChange={setSearch}
            muscleGroup={muscleGroup}
            onMuscleGroupChange={setMuscleGroup}
            equipment={equipment}
            onEquipmentChange={setEquipment}
            resultCount={resultCount}
            searchPlaceholder="Search by exercise or muscle — 'chest', 'row', 'glutes'…"
          />

          <div className="mt-5 max-h-[45vh] overflow-y-auto pr-1">
            <ExerciseDatasetList
              filterInput={filterInput}
              onSelect={toggleExercise}
              actionVariant="icon"
              selectedIds={selectedIds}
              onResultCount={handleResultCount}
            />
          </div>
        </div>

        {/* Draft routine */}
        <div className="flex min-w-0 flex-col rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
              Your Routine
            </p>
            <p className="space-mono text-xs text-[var(--contrast-two)]">
              {draft.length === 0
                ? 'Empty'
                : `${draft.length} exercise${draft.length === 1 ? '' : 's'}`}
            </p>
          </div>

          {/* Muscle coverage */}
          <div className="mt-4 flex flex-wrap gap-2">
            {coverageGroups.map((group) => {
              const active = activeCoverage.has(group.label);
              return (
                <span
                  key={group.label}
                  className={`space-mono rounded-full border px-3 py-1 text-[10px] uppercase tracking-wide transition-colors ${
                    active
                      ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]'
                      : 'border-[var(--contrast-one)] text-[var(--contrast-two)]'
                  }`}
                >
                  {group.label}
                </span>
              );
            })}
          </div>

          {/* Picked exercises */}
          <div className="mt-4 min-h-[220px] flex-1">
            {draft.length === 0 ? (
              <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--contrast-one)] p-6 text-center">
                <p className="anotation text-[var(--contrast-two)]! text-xs!">
                  Add exercises from the library
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {draft.map((entry, index) => (
                  <li
                    key={entry.exerciseId}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-two)] p-3"
                  >
                    <span className="anton text-sm text-[var(--contrast-two)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="heading-four truncate text-white">
                        {entry.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--contrast-three)]">
                        {entry.muscleGroups.map(formatLabel).join(' · ')}
                      </p>
                    </div>

                    {/* Set count */}
                    <div className="flex items-center gap-2">
                      <IconButton
                        label={`Fewer sets for ${entry.name}`}
                        onClick={() => adjustSets(entry.exerciseId, -1)}
                        disabled={entry.setCount <= 1}
                      >
                        <FiMinus />
                      </IconButton>
                      <span className="space-mono w-14 text-center text-xs text-white">
                        {entry.setCount} set{entry.setCount === 1 ? '' : 's'}
                      </span>
                      <IconButton
                        label={`More sets for ${entry.name}`}
                        onClick={() => adjustSets(entry.exerciseId, 1)}
                        disabled={entry.setCount >= MAX_SET_COUNT}
                      >
                        <FiPlus />
                      </IconButton>
                    </div>

                    {/* Reorder + remove */}
                    <div className="flex items-center gap-1">
                      <IconButton
                        label={`Move ${entry.name} up`}
                        onClick={() => move(index, -1)}
                        disabled={index === 0}
                      >
                        <FiChevronUp />
                      </IconButton>
                      <IconButton
                        label={`Move ${entry.name} down`}
                        onClick={() => move(index, 1)}
                        disabled={index === draft.length - 1}
                      >
                        <FiChevronDown />
                      </IconButton>
                      <IconButton
                        label={`Remove ${entry.name}`}
                        onClick={() =>
                          setDraft((current) =>
                            current.filter(
                              (item) => item.exerciseId !== entry.exerciseId,
                            ),
                          )
                        }
                      >
                        <FiX />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Totals */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-[var(--contrast-one)] pt-4">
            <Stat value={draft.length} label="Exercises" />
            <Stat value={setCount} label="Sets" />
            <Stat
              value={`~${draft.length === 0 ? 0 : estimatedMinutes}`}
              label="min"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-[var(--contrast-one)] disabled:hover:text-[var(--contrast-three)]"
    >
      {children}
    </button>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="anton text-xl text-white">{value}</span>
      <span className="space-mono text-[10px] uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </span>
    </div>
  );
}
