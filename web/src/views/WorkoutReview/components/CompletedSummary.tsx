import { FiCheck } from 'react-icons/fi';
import { format } from 'date-fns';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';
import { completedReps, formatDurationShort } from '../review-utils';

/**
 * Header for a finished session: split/completed pills, date, title, and the
 * four headline stats (volume, sets, reps, duration).
 */
export default function CompletedSummary({
  session,
  editing = false,
  nameValue,
  onNameChange,
}: {
  session: WorkoutSession;
  editing?: boolean;
  nameValue?: string;
  onNameChange?: (value: string) => void;
}) {
  const { completedSetCount, completedVolume, estimatedDurationSec } =
    useWorkoutSessionData(session);

  const startedAt = session.started ?? session.createdAt;
  const endedAt = session.ended;

  // Real wall-clock when both ends are known, else the shared estimate.
  const durationSec =
    startedAt && endedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) /
              1000,
          ),
        )
      : (estimatedDurationSec ?? 0);

  const date = new Date(startedAt ?? endedAt ?? Date.now());
  const isToday = date.toDateString() === new Date().toDateString();
  const dateLabel = `${isToday ? 'TODAY · ' : ''}${format(
    date,
    'MMM dd, yyyy',
  ).toUpperCase()}`;

  const tag = session.tags?.[0];
  const volumeTonnes = ((completedVolume ?? 0) / 1000).toFixed(1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {tag && (
            <span className="space-mono inline-flex rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)]">
              {tag}
            </span>
          )}
          <span className="space-mono inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            <FiCheck className="text-xs" /> Completed
          </span>
          <span className="space-mono text-[11px] uppercase tracking-wide text-[var(--contrast-three)]">
            {dateLabel}
          </span>
        </div>

        {editing ? (
          <input
            type="text"
            value={nameValue ?? ''}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="Untitled Workout"
            aria-label="Session name"
            className="anton w-full border-b border-[var(--accent-primary)] bg-transparent pb-1 text-4xl uppercase tracking-wide text-[var(--text-strong)] focus:border-[var(--accent-secondary)] focus:outline-none lg:text-6xl"
          />
        ) : (
          <h1 className="anton text-4xl uppercase tracking-wide text-[var(--text-strong)] lg:text-6xl">
            {session.name}
          </h1>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard value={`${volumeTonnes}t`} label="Volume" />
        <StatCard value={completedSetCount ?? 0} label="Sets" />
        <StatCard value={completedReps(session)} label="Reps" />
        <StatCard value={formatDurationShort(durationSec)} label="Duration" />
      </div>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-5 py-4">
      <div className="anton text-3xl leading-none text-[var(--text-strong)] lg:text-4xl">
        {value}
      </div>
      <div className="space-mono mt-2 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </div>
    </div>
  );
}
