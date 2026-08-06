import { useState } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import WorkoutProgress from './WorkoutProgress';
import { useElapsedTime } from '../../../hooks/useElapsedTime';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';

/**
 * Mobile-only collapsible "details" for the active session — elapsed time,
 * session progress, and muscle coverage folded under the title. Desktop shows
 * these in the header/sidebar instead, so this is hidden from `lg` up. The
 * collapsed header peeks the live percent + elapsed so they're glanceable
 * without expanding.
 */
export default function WorkoutDetailsPanel({
  session,
}: {
  session: WorkoutSession;
}) {
  const [open, setOpen] = useState(false);
  const { progress } = useWorkoutSessionData(session);
  const percent = Math.round((progress ?? 0) * 100);
  const elapsed = useElapsedTime({
    from: session.started ?? session.createdAt,
    until: session.ended,
    formatted: true,
  }) as string;

  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-6 py-4"
      >
        <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          Details
        </span>
        <span className="flex items-center gap-3">
          <span className="space-mono text-xs tabular-nums text-[var(--contrast-three)]">
            {percent}%<span className="px-2">·</span>
            {elapsed}
          </span>
          {open ? (
            <FiChevronUp className="text-[var(--contrast-two)]" />
          ) : (
            <FiChevronDown className="text-[var(--contrast-two)]" />
          )}
        </span>
      </button>

      {open && (
        <div className="flex flex-col gap-4 border-t border-[var(--contrast-one)] p-4">
          {/* Elapsed */}
          <div className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-two)] px-8 py-6">
            <p className="space-mono text-xs text-[var(--contrast-three)]">
              ELAPSED
            </p>
            <p className="anton mt-2 text-5xl tabular-nums leading-none text-[var(--text-strong)]">
              {elapsed}
            </p>
          </div>

          {/* Session progress + muscle coverage */}
          <WorkoutProgress session={session} />
        </div>
      )}
    </section>
  );
}
