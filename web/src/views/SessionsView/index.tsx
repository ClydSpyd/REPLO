import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';
import { format } from 'date-fns';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import { useMyWorkouts } from '../../queries/workouts';
import { estimateDurationSec } from '../../hooks/useWorkoutSessionData';

/** Best timestamp to represent a session by. */
function sessionDate(session: WorkoutSession): Date {
  return new Date(session.ended ?? session.started ?? session.createdAt);
}

/** "TODAY" for today's date, otherwise "MMM DD" (e.g. "MAY 13"). */
function dateLabel(date: Date): string {
  if (date.toDateString() === new Date().toDateString()) return 'TODAY';
  return format(date, 'MMM dd').toUpperCase();
}

interface SessionSummary {
  minutes: number;
  volumeTonnes: string;
  sets: number;
  tag?: string;
}

/** Derive the row stats for a completed session. */
function summarize(session: WorkoutSession): SessionSummary {
  let setCount = 0;
  let completedSetCount = 0;
  let totalVolume = 0;
  let completedVolume = 0;
  let totalReps = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      const volume = set.reps * set.weight;
      setCount += 1;
      totalReps += set.reps;
      totalVolume += volume;
      if (set.completed) {
        completedSetCount += 1;
        completedVolume += volume;
      }
    }
  }

  // Actual wall-clock when we have both ends, else the shared estimate.
  const minutes =
    session.started && session.ended
      ? Math.max(
          0,
          Math.round(
            (new Date(session.ended).getTime() -
              new Date(session.started).getTime()) /
              60000,
          ),
        )
      : Math.round(
          estimateDurationSec({
            totalReps,
            setCount,
            exerciseCount: session.exercises.length,
          }) / 60,
        );

  const volume = completedVolume || totalVolume;

  return {
    minutes,
    volumeTonnes: (volume / 1000).toFixed(1),
    sets: completedSetCount || setCount,
    tag: session.tags?.[0],
  };
}

export default function SessionsView() {
  const { data: workouts, isLoading, error } = useMyWorkouts();

  const sessions = useMemo(
    () =>
      [...(workouts ?? [])]
        .filter((session) => session.ended)
        .sort((a, b) => sessionDate(b).getTime() - sessionDate(a).getTime()),
    [workouts],
  );

  return (
    <ErrorBoundaryModal pageType="SessionsView">
      <div className="page-wrapper">
        <div className="w-full px-6 lg:px-2 py-6">
          <p className="anotation">History</p>
          <h1 className="heading-one text-[var(--text-strong)]">Sessions</h1>

          <section className="mt-8 rounded-2xl border border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-4 lg:p-6">
            <p className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
              Recent sessions
            </p>

            <div className="mt-4 flex flex-col gap-3">
              {isLoading && <Placeholder text="Loading sessions…" />}
              {error && (
                <Placeholder text={`Couldn't load sessions: ${error.message}`} />
              )}
              {!isLoading && !error && sessions.length === 0 && (
                <Placeholder text="No sessions yet — finish a workout and it'll show up here." />
              )}
              {sessions.map((session) => (
                <SessionRow key={session._id} session={session} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </ErrorBoundaryModal>
  );
}

function SessionRow({ session }: { session: WorkoutSession }) {
  const navigate = useNavigate();
  const { minutes, volumeTonnes, sets, tag } = summarize(session);

  return (
    <button
      type="button"
      onClick={() => navigate(`/workout/${session._id}`)}
      className="flex w-full items-center gap-4 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-4 text-left transition-colors hover:border-[var(--accent-primary)] lg:px-6"
    >
      <span className="space-mono w-16 shrink-0 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
        {dateLabel(sessionDate(session))}
      </span>

      <h3 className="anton min-w-0 flex-1 truncate text-lg uppercase tracking-wide text-[var(--text-strong)] lg:text-xl">
        {session.name}
      </h3>

      <div className="hidden shrink-0 items-center gap-5 md:flex">
        <Stat value={minutes} label="min" />
        <Stat value={`${volumeTonnes}t`} label="vol" />
        <Stat value={sets} label="sets" />
      </div>

      {tag && (
        <span className="hidden shrink-0 rounded-full border border-[var(--accent-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)] sm:inline-block space-mono">
          {tag}
        </span>
      )}

      <FiChevronRight className="shrink-0 text-[var(--contrast-two)]" />
    </button>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-bold text-[var(--text-strong)]">{value}</span>{' '}
      <span className="space-mono text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
        {label}
      </span>
    </span>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--contrast-one)] px-5 py-8 text-center">
      <p className="anotation text-xs! uppercase tracking-wide text-[var(--contrast-two)]!">
        {text}
      </p>
    </div>
  );
}
