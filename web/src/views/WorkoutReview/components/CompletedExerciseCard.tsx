import { humanizeMuscle, summarizeExercise } from '../review-utils';

/**
 * Read-only record of one exercise from a finished session: its muscles, its top
 * set and total volume, then every logged set with its own volume. The heaviest
 * completed set is highlighted as the top set.
 */
export default function CompletedExerciseCard({
  exercise,
  index,
}: {
  exercise: WorkoutExercise;
  index: number;
}) {
  const number = String(index + 1).padStart(2, '0');
  const subtitle = (exercise.exerciseDetails?.muscleGroups ?? [])
    .map(humanizeMuscle)
    .join(', ');
  const { volume, topSetIndex, topSet } = summarizeExercise(exercise);

  return (
    <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:px-6 lg:py-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3 lg:gap-4">
          <span className="anton flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--dark-two)] text-sm text-[var(--contrast-two)]">
            {number}
          </span>
          <div className="min-w-0">
            <h3 className="anton truncate text-lg uppercase tracking-wide text-[var(--text-strong)] lg:text-xl">
              {exercise.name}
            </h3>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs capitalize text-[var(--contrast-three)] lg:text-sm">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {topSet && (
          <div className="shrink-0 text-right">
            <p className="space-mono text-sm font-bold text-[var(--accent-primary)] lg:text-base">
              {topSet.weight} kg × {topSet.reps}
            </p>
            <p className="space-mono mt-0.5 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
              Top set · {volume.toLocaleString()} kg
            </p>
          </div>
        )}
      </div>

      {/* Sets */}
      <div className="mt-4 flex flex-col gap-2">
        {exercise.sets.length === 0 && (
          <p className="space-mono rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-4 text-center text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            No sets recorded
          </p>
        )}

        {exercise.sets.map((set, i) => {
          const isTop = i === topSetIndex;
          const setVolume = set.reps * set.weight;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 lg:px-5 ${
                isTop
                  ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)]'
                  : set.completed
                    ? 'border-[var(--contrast-one)]'
                    : 'border-dashed border-[var(--contrast-one)] opacity-50'
              }`}
            >
              <span className="space-mono w-12 shrink-0 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]!">
                Set {i + 1}
              </span>

              <span className="anton flex-1 text-base text-[var(--text-strong)]">
                {set.reps}
                <span className="mx-1.5 text-[var(--contrast-two)]">×</span>
                {set.weight}
                <span className="space-mono ml-1 text-xs text-[var(--contrast-three)]!">
                  kg
                </span>
              </span>

              {isTop && (
                <span className="space-mono rounded-full bg-[var(--accent-primary)] px-2.5 py-0.5 text-[9px] font-extrabold! uppercase tracking-wide text-[var(--text-contrast)]!">
                  Top
                </span>
              )}

              <span className="space-mono w-20 shrink-0 text-right text-xs text-[var(--contrast-three)]">
                {setVolume.toLocaleString()} kg
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
