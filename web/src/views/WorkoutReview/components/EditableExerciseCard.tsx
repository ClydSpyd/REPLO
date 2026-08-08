import { FiCheckCircle, FiCircle, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

export interface DraftSet {
  reps: number;
  weight: number;
  completed: boolean;
}

export interface DraftExercise {
  exerciseId?: string;
  name: string;
  subtitle: string;
  sets: DraftSet[];
}

/**
 * Editable counterpart to CompletedExerciseCard: reps/weight inputs, a
 * completed toggle, and add/remove-set controls. Purely controlled — all state
 * lives in the parent draft.
 */
export default function EditableExerciseCard({
  exercise,
  index,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
}: {
  exercise: DraftExercise;
  index: number;
  onUpdateSet: (setIndex: number, patch: Partial<DraftSet>) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onRemoveExercise: () => void;
}) {
  const number = String(index + 1).padStart(2, '0');

  return (
    <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:px-6 lg:py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 lg:gap-4">
          <span className="anton flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--dark-two)] text-sm text-[var(--contrast-two)]">
            {number}
          </span>
          <div className="min-w-0">
            <h3 className="anton truncate text-lg uppercase tracking-wide text-[var(--text-strong)] lg:text-xl">
              {exercise.name}
            </h3>
            {exercise.subtitle && (
              <p className="mt-0.5 truncate text-xs capitalize text-[var(--contrast-three)] lg:text-sm">
                {exercise.subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRemoveExercise}
          aria-label={`Remove ${exercise.name}`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--contrast-three)] transition-colors hover:bg-red-400/10 hover:text-red-400"
        >
          <FiTrash2 />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {exercise.sets.map((set, i) => (
          <div
            key={i}
            className="flex items-center gap-1.5 rounded-xl border border-[var(--contrast-one)] px-2.5 py-2.5 sm:gap-2 sm:px-4"
          >
            <span className="space-mono w-8 shrink-0 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]! sm:w-10">
              Set {i + 1}
            </span>

            <NumberField
              label="reps"
              labelHiddenOnMobile
              value={set.reps}
              onChange={(reps) => onUpdateSet(i, { reps })}
            />
            <span className="text-[var(--contrast-two)]">×</span>
            <NumberField
              label="kg"
              value={set.weight}
              step={0.5}
              onChange={(weight) => onUpdateSet(i, { weight })}
            />

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => onUpdateSet(i, { completed: !set.completed })}
                aria-label={set.completed ? 'Mark incomplete' : 'Mark complete'}
                aria-pressed={set.completed}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-[var(--dark-two)]"
              >
                {set.completed ? (
                  <FiCheckCircle className="text-[var(--accent-primary)]" />
                ) : (
                  <FiCircle className="text-[var(--contrast-two)]" />
                )}
              </button>
              <button
                type="button"
                onClick={() => onRemoveSet(i)}
                aria-label={`Remove set ${i + 1}`}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--contrast-three)] transition-colors hover:bg-red-400/10 hover:text-red-400"
              >
                <FiX />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onAddSet}
          className="space-mono mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--contrast-one)] py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          <FiPlus /> Add set
        </button>
      </div>
    </section>
  );
}

function NumberField({
  label,
  labelHiddenOnMobile = false,
  value,
  step,
  onChange,
}: {
  label: string;
  labelHiddenOnMobile?: boolean;
  value: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step ?? 1}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => {
          const next = parseFloat(e.target.value);
          onChange(Number.isFinite(next) && next >= 0 ? next : 0);
        }}
        className="anton w-12 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] px-1.5 py-1.5 text-center text-base text-[var(--text-strong)] focus:border-[var(--accent-primary)] focus:outline-none sm:w-14 sm:px-2 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span
        className={`space-mono text-xs text-[var(--contrast-three)]! ${
          labelHiddenOnMobile ? 'hidden sm:inline' : ''
        }`}
      >
        {label}
      </span>
    </label>
  );
}
