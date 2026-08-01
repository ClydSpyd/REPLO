import { useMemo } from 'react';
import { FiInfo } from 'react-icons/fi';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';
import { coverageGroups } from '../../../config/muscles';

interface WorkoutProgressProps {
  session: WorkoutSession;
}

export default function WorkoutProgress({ session }: WorkoutProgressProps) {
  const {
    exerciseCount,
    completedSetCount,
    completedVolume,
    progress,
  } = useWorkoutSessionData(session);

  const percent = Math.round((progress ?? 0) * 100);
  const hasExercises = (exerciseCount ?? 0) > 0;

  // Which coverage buckets are hit by the current exercises.
  const activeGroups = useMemo(() => {
    const hit = new Set<string>();
    for (const exercise of session.exercises) {
      const details = exercise.exerciseDetails;
      for (const muscle of [
        ...(details?.muscleGroups ?? []),
        ...(details?.primaryMuscleGroups ?? []),
        ...(details?.secondaryMuscleGroups ?? []),
      ]) {
        hit.add(muscle);
      }
    }
    return new Set(
      coverageGroups.filter((group) =>
        group.match.some((m) => hit.has(m)),
      ).map((group) => group.label),
    );
  }, [session.exercises]);

  return (
    <div className="flex flex-col gap-4">
      {/* Session progress */}
      <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-white">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          SESSION PROGRESS
        </p>

        <div className="mt-2 flex items-baseline">
          <span className="anton text-7xl leading-none text-[var(--accent-primary)]">
            {percent}
          </span>
          <span className="anton ml-1 text-3xl text-[var(--accent-primary)]">
            %
          </span>
        </div>

        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--dark-three)]">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2">
          <Stat label="Sets done" value={completedSetCount ?? 0} />
          <Stat label="Exercises" value={exerciseCount ?? 0} />
          <Stat label="Volume kg" value={completedVolume ?? 0} />
        </div>
      </section>

      {/* Muscle coverage */}
      <section className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-6 text-white">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          MUSCLE COVERAGE
        </p>

        {!hasExercises && (
          <p className="mt-3 body-text text-sm!">
            Add exercises and we'll map which muscle groups this session hits.
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {coverageGroups.map((group) => {
            const active = activeGroups.has(group.label);
            return (
              <span
                key={group.label}
                className={`space-mono rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors ${
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
      </section>

      {/* Contextual tip while the session is empty */}
      {!hasExercises && (
        <section className="flex items-start gap-3 rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-6 py-4 text-sm text-[var(--contrast-three)]">
          <FiInfo className="mt-0.5 shrink-0 text-base text-[var(--accent-primary)]" />
          <p>
            <span className="font-semibold text-white">Tip:</span> your rest
            timer and set logging unlock as soon as the first exercise lands.
          </p>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="anton text-3xl text-white">
        {value.toLocaleString()}
      </span>
      <span className="space-mono mt-1 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
        {label}
      </span>
    </div>
  );
}
