import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiChevronLeft,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from 'react-icons/fi';
import { useWorkout } from '../../queries/workouts';
import {
  useDeleteWorkout,
  useRepeatWorkout,
  useUpdateWorkout,
} from '../../mutations/workouts';
import { useToast } from '../../context/toast';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ExercisePickerModal from '../../components/exercise-picker-modal';
import CompletedSummary from './components/CompletedSummary';
import CompletedExerciseCard from './components/CompletedExerciseCard';
import EditableExerciseCard, {
  type DraftExercise,
  type DraftSet,
} from './components/EditableExerciseCard';
import VolumeByMuscle from './components/VolumeByMuscle';
import { humanizeMuscle } from './review-utils';

interface Draft {
  name: string;
  exercises: DraftExercise[];
}

/** Snapshot a saved session into an editable draft. */
function toDraft(workout: WorkoutSession): Draft {
  return {
    name: workout.name,
    exercises: workout.exercises.map((exercise) => ({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      subtitle: (exercise.exerciseDetails?.muscleGroups ?? [])
        .map(humanizeMuscle)
        .join(', '),
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
        completed: Boolean(set.completed),
      })),
    })),
  };
}

/**
 * Review a completed workout: headline stats, per-muscle volume, and a full
 * exercise-by-exercise breakdown. The title and sets can be edited in place;
 * the session can also be repeated or deleted.
 */
export default function WorkoutReview() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: workout, isLoading, error } = useWorkout(workoutId);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [addingExercise, setAddingExercise] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const editing = draft !== null;

  const { mutate: deleteWorkout, isPending: isDeleting, error: deleteError } =
    useDeleteWorkout();
  const { mutate: repeatWorkout, isPending: isRepeating } = useRepeatWorkout();
  const { mutate: updateWorkout, isPending: isSaving } =
    useUpdateWorkout(workoutId);

  const handleDelete = () => {
    if (!workout) return;
    deleteWorkout(workout._id, {
      onSuccess: () => {
        toast.success('Session deleted');
        navigate('/sessions');
      },
    });
  };

  const handleRepeat = () => {
    if (!workout) return;
    repeatWorkout(workout, {
      onSuccess: () => {
        toast.success('Workout started', workout.name);
        navigate('/workout');
      },
      onError: (err) =>
        toast.error("Couldn't start workout", (err as Error).message),
    });
  };

  // ---- Editing -------------------------------------------------------------

  const updateSet = (
    exIndex: number,
    setIndex: number,
    patch: Partial<DraftSet>,
  ) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            exercises: d.exercises.map((ex, i) =>
              i === exIndex
                ? {
                    ...ex,
                    sets: ex.sets.map((s, j) =>
                      j === setIndex ? { ...s, ...patch } : s,
                    ),
                  }
                : ex,
            ),
          }
        : d,
    );

  const addSet = (exIndex: number) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            exercises: d.exercises.map((ex, i) => {
              if (i !== exIndex) return ex;
              const last = ex.sets[ex.sets.length - 1];
              // Seed a new set from the last one so the user tweaks, not retypes.
              const next: DraftSet = last
                ? { ...last, completed: false }
                : { reps: 0, weight: 0, completed: false };
              return { ...ex, sets: [...ex.sets, next] };
            }),
          }
        : d,
    );

  const removeSet = (exIndex: number, setIndex: number) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            exercises: d.exercises.map((ex, i) =>
              i === exIndex
                ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
                : ex,
            ),
          }
        : d,
    );

  const addExercise = (exercise: ExerciseMinimal) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            exercises: [
              ...d.exercises,
              {
                exerciseId: exercise.id,
                name: exercise.name,
                subtitle: (exercise.muscleGroups ?? [])
                  .map(humanizeMuscle)
                  .join(', '),
                sets: [{ reps: 0, weight: 0, completed: false }],
              },
            ],
          }
        : d,
    );
    setAddingExercise(false);
  };

  const removeExercise = (exIndex: number) =>
    setDraft((d) =>
      d
        ? { ...d, exercises: d.exercises.filter((_, i) => i !== exIndex) }
        : d,
    );

  const handleSave = () => {
    if (!draft) return;
    updateWorkout(
      {
        name: draft.name.trim() || 'Untitled Workout',
        exercises: draft.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            completed: s.completed,
          })),
        })) as WorkoutSession['exercises'],
      },
      {
        onSuccess: () => {
          toast.success('Session updated');
          setDraft(null);
        },
        onError: (err) =>
          toast.error("Couldn't save changes", (err as Error).message),
      },
    );
  };

  return (
    <ErrorBoundaryModal pageType="WorkoutReview">
      <div className="page-wrapper">
        <div className="w-full px-6 lg:px-2 py-6">
          <Link
            to="/sessions"
            className="space-mono inline-flex items-center gap-1 text-xs uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:text-[var(--text-strong)]"
          >
            <FiChevronLeft /> All sessions
          </Link>

          <div className="mt-4">
            {isLoading && <Placeholder text="Loading workout..." />}

            {error && (
              <Placeholder
                text={`Couldn't load this workout: ${error.message}`}
              />
            )}

            {!isLoading && !error && !workout && (
              <Placeholder text="Workout not found" />
            )}

            {workout && (
              <div className="flex flex-col gap-6 pb-28">
                <CompletedSummary
                  session={workout}
                  editing={editing}
                  nameValue={draft?.name}
                  onNameChange={(name) =>
                    setDraft((d) => (d ? { ...d, name } : d))
                  }
                />

                {/* Personal records for this session go here — deferred until we
                    can derive per-session PRs. */}

                {!editing && <VolumeByMuscle session={workout} />}

                <div>
                  <p className="space-mono mb-3 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
                    Exercise breakdown
                  </p>

                  {editing && draft ? (
                    <div className="flex flex-col gap-3">
                      {draft.exercises.map((exercise, index) => (
                        <EditableExerciseCard
                          key={index}
                          exercise={exercise}
                          index={index}
                          onUpdateSet={(setIndex, patch) =>
                            updateSet(index, setIndex, patch)
                          }
                          onAddSet={() => addSet(index)}
                          onRemoveSet={(setIndex) => removeSet(index, setIndex)}
                          onRemoveExercise={() => removeExercise(index)}
                        />
                      ))}

                      <button
                        type="button"
                        onClick={() => setAddingExercise(true)}
                        className="space-mono flex items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--contrast-one)] py-4 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
                      >
                        <FiPlus /> Add exercise
                      </button>
                    </div>
                  ) : workout.exercises.length === 0 ? (
                    <Placeholder text="No exercises were logged in this session" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {workout.exercises.map((exercise, index) => (
                        <CompletedExerciseCard
                          key={`${exercise.exerciseId}-${index}`}
                          exercise={exercise}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        {workout && (
          <div className="sticky bottom-0 z-10 border-t border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--surface-base)_88%,transparent)] px-6 py-4 backdrop-blur lg:px-2">
            {editing ? (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  disabled={isSaving}
                  className="space-mono flex-1 rounded-lg border border-[var(--contrast-one)] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="anton flex-1 rounded-lg bg-[var(--accent-primary)] px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-contrast)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {isSaving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label="Delete session"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-red-400/60 hover:text-red-400"
                >
                  <FiTrash2 className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={() => setDraft(toDraft(workout))}
                  aria-label="Edit session"
                  className="space-mono flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--contrast-one)] text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] sm:w-auto sm:px-4"
                >
                  <FiEdit2 />
                  <span className="hidden sm:inline">Edit</span>
                </button>

                <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleRepeat}
                    disabled={isRepeating}
                    aria-label="Repeat workout"
                    className="space-mono flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--contrast-one)] text-xs font-bold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-5"
                  >
                    <FiRefreshCw
                      className={isRepeating ? 'animate-spin' : ''}
                    />
                    <span className="hidden sm:inline">
                      {isRepeating ? 'Starting…' : 'Repeat workout'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/sessions')}
                    className="anton rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-contrast)] transition-colors hover:brightness-95 sm:px-8"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {addingExercise && (
        <ExercisePickerModal
          onSelect={addExercise}
          onClose={() => setAddingExercise(false)}
          subHeading="Add to session"
          description="Search the library and add a lift to this session."
        />
      )}

      {confirmingDelete && workout && (
        <ConfirmDialog
          title="Delete this session?"
          message={`"${workout.name}" and its logged sets will be permanently removed. Your personal records and stats will update to reflect this.`}
          confirmLabel="Delete"
          isPending={isDeleting}
          error={deleteError?.message}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </ErrorBoundaryModal>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full grow rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6 flex items-center justify-center">
      <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide">
        {text}
      </p>
    </div>
  );
}
