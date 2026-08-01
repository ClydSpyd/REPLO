import { FiCheckCircle, FiCircle } from 'react-icons/fi';

/**
 * Read-only record of one exercise from a finished session: every set with its
 * reps, weight and whether it was logged. No editing affordances.
 */
export default function CompletedExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const number = String(index + 1).padStart(2, '0');
  const muscles = exercise.exerciseDetails?.muscleGroups ?? [];
  const loggedCount = exercise.sets.filter((set) => set.completed).length;
  const volume = exercise.sets.reduce(
    (total, set) => total + (set.completed ? set.reps * set.weight : 0),
    0,
  );

  return (
    <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:px-8 lg:py-6">
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
            {volume.toLocaleString()} kg
          </span>
          <span className="space-mono rounded-full border border-[var(--contrast-one)] px-4 py-1 text-[10px] lg:text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)]">
            {loggedCount}/{exercise.sets.length} Logged
          </span>
        </div>
      </div>

      {/* Sets */}
      <div className="mt-5 flex flex-col gap-2">
        {exercise.sets.length === 0 && (
          <p className="space-mono rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-4 text-center text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            No sets recorded
          </p>
        )}

        {exercise.sets.map((set, i) => (
          <div
            key={i}
            className={`flex items-center justify-between rounded-xl border px-6 py-3 ${
              set.completed
                ? 'border-[var(--contrast-one)]'
                : 'border-dashed border-[var(--contrast-one)] opacity-60'
            }`}
          >
            <div className="flex items-baseline gap-3">
              <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
                Set {i + 1}
              </span>
              <span className="anton text-lg text-[var(--contrast-two)]!">
                {set.reps}
                <span className="space-mono ml-1 text-xs text-[var(--contrast-two)]!">
                  reps
                </span>
                <span className="mx-1">×</span>
                {set.weight}
                <span className="space-mono ml-1 text-xs text-[var(--contrast-two)]!">
                  kg
                </span>
              </span>
            </div>

            <span className="text-xl">
              {set.completed ? (
                <FiCheckCircle className="text-[var(--accent-primary)]" />
              ) : (
                <FiCircle className="text-[var(--contrast-two)]" />
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Turn a kebab-case value ("full-body") into a display label ("Full Body").
function formatLabel(value: string): string {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
