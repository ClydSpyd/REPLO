import { useState } from 'react';
import {
  FiCheck,
  FiCheckCircle,
  FiCircle,
  FiMinus,
  FiPlus,
  FiRepeat,
  FiTrash2,
  FiX,
} from 'react-icons/fi';
import {
  useAddSetToExercise,
  useUpdateSetInExercise,
  useToggleSetCompleted,
  useDeleteSetFromExercise,
  useRemoveExerciseFromWorkout,
} from '../../../mutations/workouts';
import SwitchExerciseModal from './SwitchExerciseModal';

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  index: number;
  /** Whether this card is expanded (controlled by the parent list). */
  open: boolean;
  /** Expand this card. */
  onOpen: () => void;
  /** Collapse this card. */
  onClose: () => void;
}

/**
 * A single exercise in the active workout. Has a collapsed summary state and an
 * expanded state where individual sets can be edited and logged. Open/closed is
 * controlled by the parent so only one card is open at a time. All set edits
 * and toggles are kept in local state for now — the API/store wiring is a
 * separate concern.
 */
export default function ExerciseCard({
  exercise,
  index,
  open,
  onOpen,
  onClose,
}: ExerciseCardProps) {
  const [openSetIndex, setOpenSetIndex] = useState<number | null>(0);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [switching, setSwitching] = useState(false);
  const sets = exercise.sets.map((s) => ({
    reps: s.reps,
    weight: s.weight,
    completed: s.completed,
  }));

  const number = String(index + 1).padStart(2, '0');
  const muscles = exercise.exerciseDetails?.muscleGroups ?? [];
  const loggedCount = sets.filter((s) => s.completed).length;

  const { mutate: addSetToExercise } = useAddSetToExercise();
  const { mutate: updateSetInExercise } = useUpdateSetInExercise();
  const { mutate: toggleSetCompleted } = useToggleSetCompleted();
  const { mutate: deleteSetFromExercise } = useDeleteSetFromExercise();
  const { mutate: removeExerciseFromWorkout } = useRemoveExerciseFromWorkout();

  const confirmRemove = () =>
    removeExerciseFromWorkout({ exerciseId: exercise.exerciseId! });

  const addSet = () => {
    // Seed a subsequent set from the previous one's reps/weight; a new set is
    // never pre-completed. The first set falls back to zeros.
    const previous = sets[sets.length - 1];
    const setData: WorkoutSetInput = previous
      ? { reps: previous.reps, weight: previous.weight, completed: false }
      : { reps: 0, weight: 0, completed: false };
    addSetToExercise({ exerciseId: exercise.exerciseId!, setData });
    setOpenSetIndex(sets.length); // open the new set
  };

  const updateSet = (i: number, patch: Partial<WorkoutSetInput>) => {
    updateSetInExercise({
      exerciseId: exercise.exerciseId!,
      setIndex: i,
      setData: patch,
    });
  };

  const adjust = (i: number, field: 'reps' | 'weight', delta: number) =>
    updateSet(i, { [field]: Math.max(0, sets[i][field] + delta) });

  const logSet = (i: number) => {
    updateSet(i, { completed: true });
    // Advance to the next not-yet-logged set, if any.
    const next = sets.findIndex((s, idx) => idx > i && !s.completed);
    setOpenSetIndex(next === -1 ? null : next);
  };

  const toggleCompleted = (i: number) =>
    toggleSetCompleted({
      exerciseId: exercise.exerciseId!,
      setIndex: i,
      completed: !sets[i].completed,
    });

  const deleteSet = (i: number) => {
    deleteSetFromExercise({ exerciseId: exercise.exerciseId!, setIndex: i });
    setOpenSetIndex((current) => {
      if (current === null) return null;
      if (current === i) return null;
      return current > i ? current - 1 : current;
    });
  };

  // ---- Collapsed state -----------------------------------------------------
  if (!open) {
    return (
      <section
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => e.key === 'Enter' && onOpen()}
        className="cursor-pointer rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:px-8 lg:py-6 transition-colors hover:border-[var(--contrast-two)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="anton text-xl lg:text-4xl text-[var(--contrast-two)]">
              {number}
            </span>
            <div className="min-w-0">
              <h3 className="heading-four truncate text-white">
                {exercise.name}
              </h3>
              <p className="mt-1 text-[10px] lg:text-sm text-[var(--contrast-three)]">
                {muscles.map(formatLabel).join(' · ')}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)] hidden lg:inline-block">
              {loggedCount}/{sets.length} Logged
            </span>
            <span className="space-mono rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-4 py-1 text-[10px] lg:text-xs font-bold uppercase tracking-wide text-[var(--accent-primary)]">
              Open
            </span>
          </div>
        </div>

        {/* Set summary chips */}
        <div className="mt-5 flex flex-wrap gap-3">
          {sets.map((set, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-lg border border-[var(--contrast-one)] px-2 lg:px-4 py-2.5"
            >
              <span className="space-mono text-xs lg:text-sm text-[var(--contrast-two)]!">
                {set.reps} × {set.weight}
              </span>
              {set.completed ? (
                <FiCheckCircle className="text-[var(--accent-primary)]" />
              ) : (
                <FiCircle className="text-[var(--contrast-two)]" />
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  // ---- Expanded state ------------------------------------------------------
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--accent-primary)] bg-[var(--dark-one)] px-4 py-6 lg:px-8 lg:py-6">
      {confirmingRemove && (
        <RemoveConfirmOverlay
          exerciseName={exercise.name}
          onConfirm={confirmRemove}
          onCancel={() => setConfirmingRemove(false)}
        />
      )}

      {switching && (
        <SwitchExerciseModal
          currentExercise={exercise}
          onClose={() => setSwitching(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[var(--accent-primary)]">●</span>
            <span className="space-mono uppercase tracking-wide text-[var(--accent-primary)]">
              Now Lifting
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h3 className="heading-three text-white">{exercise.name}</h3>
            <HeaderButton
              icon={<FiRepeat />}
              label="Switch"
              onClick={() => setSwitching(true)}
            />
            <HeaderButton
              icon={<FiTrash2 />}
              label="Remove"
              onClick={() => setConfirmingRemove(true)}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {muscles.map((muscle, i) => (
              <>
                <span
                  key={muscle}
                  className="space-mono rounded-full lg:border border-[var(--contrast-one)] lg:px-3 lg:py-1 text-[10px] lg:text-xs uppercase tracking-wide text-[var(--contrast-three)]!"
                >
                  {formatLabel(muscle)}
                </span>
                {i < muscles.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="text-[var(--contrast-three)] lg:hidden"
                    style={{
                      lineHeight: 1,
                    }}
                  >
                    •
                  </span>
                )}
              </>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex shrink-0 flex-col items-end"
        >
          <span className="anton text-4xl text-[var(--contrast-two)]">
            {number}
          </span>
          <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)] hidden lg:inline-block">
            {loggedCount}/{sets.length} Logged
          </span>
        </button>
      </div>

      {/* Progress segments */}
      <div className="mt-5 flex gap-2">
        {sets.map((set, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${
              set.completed
                ? 'bg-[var(--accent-primary)]'
                : 'bg-[var(--contrast-one)]'
            }`}
          />
        ))}
      </div>

      {/* Sets */}
      <div className="mt-5 flex flex-col gap-3">
        {sets.length === 0 && (
          <p className="space-mono rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-4 text-center text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            No sets yet — add your first set
          </p>
        )}
        {sets.map((set, i) =>
          i === openSetIndex ? (
            <SetEditor
              key={i}
              setNumber={i + 1}
              set={set}
              targetReps={exercise.sets[i]?.reps ?? set.reps}
              onAdjust={(field, delta) => adjust(i, field, delta)}
              onLog={() => logSet(i)}
              onDelete={() => deleteSet(i)}
            />
          ) : (
            <SetSummaryRow
              key={i}
              setNumber={i + 1}
              set={set}
              onOpen={() => setOpenSetIndex(i)}
              onToggle={() => toggleCompleted(i)}
              onDelete={() => deleteSet(i)}
            />
          ),
        )}

        <button
          type="button"
          onClick={addSet}
          className="space-mono flex items-center justify-center gap-2 self-start rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-3 text-sm font-bold uppercase tracking-wide text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] w-full lg:w-fit"
        >
          <FiPlus /> Add Set
        </button>
      </div>
    </section>
  );
}

function HeaderButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="space-mono hidden lg:flex items-center gap-2 rounded-full border border-[var(--contrast-one)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
    >
      {icon}
      {label}
    </button>
  );
}

function RemoveConfirmOverlay({
  exerciseName,
  onConfirm,
  onCancel,
}: {
  exerciseName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[color-mix(in_srgb,var(--dark-one)_80%,transparent)] px-8 text-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)]">
          <FiTrash2 className="text-xl text-[var(--accent-primary)]" />
        </div>
        <h4 className="heading-four text-white">Remove exercise?</h4>
        <p className="body-text text-sm! text-[var(--contrast-three)]">
          {exerciseName} and all its sets will be removed from this session.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="anton rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function SetEditor({
  setNumber,
  set,
  // targetReps,
  onAdjust,
  onLog,
  onDelete,
}: {
  setNumber: number;
  set: WorkoutSetInput;
  targetReps: number;
  onAdjust: (field: 'reps' | 'weight', delta: number) => void;
  onLog: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--accent-primary)] bg-[var(--dark-two)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[var(--accent-primary)]">●</span>
          <span className="anton text-xl text-white">Set {setNumber}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
            Target · {targetReps} reps
          </span> */}
          <button
            type="button"
            onClick={onDelete}
            className="space-mono rounded-lg border border-[var(--contrast-one)] px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col lg:grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <Stepper
          label="Reps"
          value={set.reps}
          onDecrement={() => onAdjust('reps', -1)}
          onIncrement={() => onAdjust('reps', 1)}
        />
        <div className="h-16 w-px bg-[var(--contrast-one)] hidden lg:inline-block" />
        <Stepper
          label="Weight · kg"
          value={set.weight}
          onDecrement={() => onAdjust('weight', -2.5)}
          onIncrement={() => onAdjust('weight', 2.5)}
        />
      </div>

      <button
        type="button"
        onClick={onLog}
        className="anton mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] py-4 text-xl font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95"
      >
        <FiCheck /> Log Set
      </button>
    </div>
  );
}

function Stepper({
  label,
  value,
  onDecrement,
  onIncrement,
}: {
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex flex-col items-center w-full lg:w-fit lg:mx-auto">
      <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </span>
      <div className="mt-2 flex items-center gap-4 w-full">
        <StepperButton icon={<FiMinus />} onClick={onDecrement} />
        <span className="anton min-w-[2ch] grow text-center text-4xl lg:text-6xl text-white">
          {value}
        </span>
        <StepperButton icon={<FiPlus />} onClick={onIncrement} />
      </div>
    </div>
  );
}

function StepperButton({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-lg text-white transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
    >
      {icon}
    </button>
  );
}

function SetSummaryRow({
  setNumber,
  set,
  onOpen,
  onToggle,
  onDelete,
}: {
  setNumber: number;
  set: WorkoutSetInput;
  onOpen: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      className="flex cursor-pointer items-center justify-between rounded-xl border border-[var(--contrast-one)] px-6 py-4 transition-colors hover:border-[var(--contrast-two)]"
    >
      <div className="flex items-center gap-3">
        <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
          Set {setNumber}
        </span>
        <span className="anton text-lg text-[var(--contrast-two)]!">
          {set.reps}
          <span className="space-mono ml-1 text-xs text-[var(--contrast-two)]! hidden lg:">
            reps
          </span>
          <span className="mx-1">×</span>
          {set.weight}
          <span className="space-mono ml-1 text-xs text-[var(--contrast-two)]!">
            kg
          </span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]! hidden lg:inline-block">
          Tap to log
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          <FiX />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="text-xl"
        >
          {set.completed ? (
            <FiCheckCircle className="text-[var(--accent-primary)]" />
          ) : (
            <FiCircle className="text-[var(--contrast-two)]" />
          )}
        </button>
      </div>
    </div>
  );
}

// Turn a kebab-case value ("full-body") into a display label ("Full Body").
function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
