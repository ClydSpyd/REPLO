import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { HiBolt } from 'react-icons/hi2';
import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useMyWorkouts } from '../../queries/workouts';
import { useDeleteWorkout } from '../../mutations/workouts';
import { useToast } from '../../context/toast';
import { estimateDurationSec } from '../../hooks/useWorkoutSessionData';

/** Best timestamp to represent a session by — the day it started (local). */
function sessionDate(session: WorkoutSession): Date {
  return new Date(session.started ?? session.createdAt ?? session.ended);
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
  const toast = useToast();

  const [pendingDelete, setPendingDelete] = useState<WorkoutSession | null>(
    null,
  );
  const {
    mutate: deleteWorkout,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteWorkout();

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteWorkout(pendingDelete._id, {
      onSuccess: () => {
        toast.success('Session deleted');
        setPendingDelete(null);
      },
    });
  };

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

          {!isLoading && !error && (
            <section className="mt-8 rounded-2xl border border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-4 lg:p-6">
              <p className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
                This week
              </p>
              <WeekGrid sessions={sessions} />
            </section>
          )}

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
                <EmptySessions />
              )}
              {sessions.map((session) => (
                <SessionRow
                  key={session._id}
                  session={session}
                  onDelete={() => setPendingDelete(session)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this session?"
          message={`"${pendingDelete.name}" and its logged sets will be permanently removed. Your personal records and stats will update to reflect this.`}
          confirmLabel="Delete"
          isPending={isDeleting}
          error={deleteError?.message}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </ErrorBoundaryModal>
  );
}

/**
 * The current Mon→Sun week as seven cells. Days with a session are filled and
 * clickable (→ session details); hovering one reveals a tooltip summary.
 */
function WeekGrid({ sessions }: { sessions: WorkoutSession[] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  // sessions arrive newest-first, so [0] is the most recent one that day.
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    const session = sessions.find((s) => isSameDay(sessionDate(s), day));
    return { day, session };
  });

  return (
    <div className="mt-4 grid grid-cols-7 gap-2">
      {days.map(({ day, session }) => (
        <DayCell
          key={day.toISOString()}
          day={day}
          session={session}
          isToday={isSameDay(day, today)}
        />
      ))}
    </div>
  );
}

function DayCell({
  day,
  session,
  isToday,
}: {
  day: Date;
  session?: WorkoutSession;
  isToday: boolean;
}) {
  const navigate = useNavigate();
  const worked = Boolean(session);
  const summary = session ? summarize(session) : null;

  return (
    <div className="group relative">
      <button
        type="button"
        disabled={!worked}
        onClick={() => session && navigate(`/workout/${session._id}`)}
        className={`flex w-full flex-col items-center gap-1 rounded-xl border py-3 transition-colors ${
          worked
            ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)] hover:brightness-110'
            : 'border-[var(--contrast-one)] text-[var(--contrast-three)]'
        } ${isToday ? 'ring-1 ring-[var(--accent-primary)] ring-offset-1 ring-offset-[var(--dark-one)]' : ''}`}
      >
        <span className="space-mono text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
          {format(day, 'EEEEE')}
        </span>
        <span className="anton text-lg leading-none text-[var(--text-strong)]">
          {format(day, 'd')}
        </span>
        <span
          className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
            worked ? 'bg-[var(--accent-primary)]' : 'bg-[var(--contrast-one)]'
          }`}
        />
      </button>

      {session && summary && (
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] px-3 py-2 text-left shadow-lg group-hover:block">
          <p className="anton max-w-[180px] truncate text-sm uppercase tracking-wide text-[var(--text-strong)]">
            {session.name}
          </p>
          <p className="space-mono mt-1 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]">
            {summary.minutes} min · {summary.volumeTonnes}t
          </p>
        </div>
      )}
    </div>
  );
}

function SessionRow({
  session,
  onDelete,
}: {
  session: WorkoutSession;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const { minutes, volumeTonnes, sets, tag } = summarize(session);

  return (
    <div className="group relative flex items-center rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] transition-colors hover:border-[var(--accent-primary)]">
      <button
        type="button"
        onClick={() => navigate(`/workout/${session._id}`)}
        className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4 text-left lg:px-6"
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

      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${session.name}`}
        className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--contrast-three)] transition-all hover:bg-red-400/10 hover:text-red-400 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
      >
        <FiTrash2 />
      </button>
    </div>
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

/**
 * Empty history — mirrors the routines-library empty state (icon tile, heading,
 * copy, accent CTA), pointing the user straight into a workout.
 */
function EmptySessions() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] px-6 py-16 text-center lg:py-20">
      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-2xl text-[var(--accent-primary)]">
        <HiBolt />
      </div>

      <h3 className="anton mt-6 text-3xl uppercase tracking-wide text-[var(--text-strong)]">
        No sessions yet
      </h3>

      <p className="body-text mt-3 max-w-[440px] text-sm! text-[var(--contrast-three)]">
        Finish a workout and it lands here — your history, volume and personal
        records all build from your sessions.
      </p>

      <Link
        to="/workout"
        className="anton mt-6 flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-contrast)] transition-colors hover:brightness-95"
      >
        <HiBolt />
        Workout now
      </Link>
    </div>
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
