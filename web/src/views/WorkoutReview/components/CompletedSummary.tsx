import { FaRegCalendar, FaRegClock } from 'react-icons/fa';
import { format } from 'date-fns';
import { formatElapsed } from '../../../hooks/useElapsedTime';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';

/**
 * Static header for a finished session — the read-only counterpart to
 * WorkoutSummary. No live indicator, no editable title, no End Workout action.
 */
export default function CompletedSummary({
  session,
}: {
  session: WorkoutSession;
}) {
  const { exerciseCount, setCount } = useWorkoutSessionData(session);

  const startedAt = session.started ?? session.createdAt;
  const endedAt = session.ended;

  // Final duration, frozen — both ends are known, so nothing ticks here.
  const durationSeconds =
    startedAt && endedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000,
          ),
        )
      : null;

  const dateLabel = format(
    new Date(endedAt ?? startedAt ?? Date.now()),
    'dd MMM yyyy',
  ).toUpperCase();

  return (
    <div className="w-full flex flex-col lg:flex-row justify-between gap-4 h-full min-h-0 mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[10px] h-[10px] rounded-full bg-[var(--contrast-two)]"
            aria-hidden="true"
          />
          <p className="anotation">Completed session</p>
        </div>

        <h1 className="heading-one text-white">{session.name}</h1>

        <div className="hidden lg:flex gap-2 mt-2">
          <div className="flex items-center px-4 py-2 rounded-md bg-[var(--dark-one)] text-[var(--contrast-three)] border border-[var(--contrast-one)]">
            <FaRegClock className="text-sm relative bottom-[1px] mr-2" />
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {durationSeconds === null ? '-' : formatElapsed(durationSeconds)}
            </p>
          </div>
          <div className="flex items-center px-4 py-2 rounded-md bg-[var(--dark-one)] text-[var(--contrast-three)] border border-[var(--contrast-one)]">
            <FaRegCalendar className="text-sm relative bottom-[1px] mr-2" />
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {dateLabel}
            </p>
          </div>
          <div className="flex items-center px-4 py-2 rounded-md bg-[var(--dark-one)] text-[var(--contrast-three)] border border-[var(--contrast-one)]">
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {exerciseCount} exercises
            </p>
            <p className="text-xs! font-[700] text-[var(--contrast-three)]! px-2">
              •
            </p>
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {setCount} sets
            </p>
          </div>
        </div>
      </div>

      <div className="h-full justify-center hidden lg:flex flex-col items-end w-40">
        <p className="text-[var(--contrast-three)]! text-xs! font-[700] pr-1">
          DURATION
        </p>
        <div className="anotation text-7xl! font-bold text-white/80! mb-2 tabular-nums whitespace-nowrap">
          {durationSeconds === null ? '--:--' : formatElapsed(durationSeconds)}
        </div>
      </div>
    </div>
  );
}
