import { FaRegCalendar, FaRegClock, FaStop, FaStopwatch } from 'react-icons/fa';
import { format } from 'date-fns';
import WorkoutTitleBlock from './WorkoutTitleBlock';
import Button from '../../../components/ui/Button';
import ElapsedTimer from '../../../components/ui/ElapsedTimer';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';
import { useRestTimer } from '../../../hooks/useRestTimer';

export default function WorkoutSummary({
  session,
  setConfirmingEnd,
}: {
  setConfirmingEnd: React.Dispatch<React.SetStateAction<boolean>>;
  session?: WorkoutSession | null;
}) {
  const { exerciseCount, setCount, estimatedDurationSec } =
    useWorkoutSessionData(session ?? null);
  const { open: openRestTimer } = useRestTimer();
  return (
    <div className="w-full flex flex-col lg:flex-row justify-between gap-4 min-h-0 mb-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-[10px] h-[10px] rounded-full bg-[var(--accent-primary)] animate-pulse"
            aria-label="Live indicator"
          />
          <p className="anotation">Live session</p>
        </div>
        <WorkoutTitleBlock />
        <div className="hidden lg:flex gap-2">
          <div className="flex items-center px-4 py-2 rounded-md bg-[var(--dark-one)] text-[var(--contrast-three)] border border-[var(--contrast-one)]">
            <FaRegClock className="text-sm relative bottom-[1px] mr-2" />
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {estimatedDurationSec
                ? `~${Math.ceil(estimatedDurationSec / 60)} min`
                : '-'}
            </p>
          </div>
          <div className="flex items-center px-4 py-2 rounded-md bg-[var(--dark-one)] text-[var(--contrast-three)] border border-[var(--contrast-one)]">
            <FaRegCalendar className="text-sm relative bottom-[1px] mr-2" />
            <p className="text-xs! font-[700] text-[var(--contrast-three)]!">
              {format(new Date(), 'dd MMM yyyy').toUpperCase()}
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
      <div className="h-full justify-center hidden lg:flex flex-col items-end gap-2">
        <ElapsedTimer
          from={session?.started ?? session?.createdAt}
          until={session?.ended}
        />
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            aria-label="Open rest timer"
            onClick={openRestTimer}
            className="flex w-[80px] shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <FaStopwatch className="text-2xl" />
          </button>
          <Button
            icon={<FaStop />}
            text="End Workout"
            size="xl"
            onClick={() => setConfirmingEnd(true)}
            disabled={!session}
          />
        </div>
      </div>
    </div>
  );
}
