import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStop } from 'react-icons/fa';
import Modal from '../../../components/ui/Modal';
import { useEndWorkout } from '../../../mutations/workouts';
import {
  useCreateRoutine,
  routineFromSession,
} from '../../../mutations/routines';
import { useWorkoutSessionData } from '../../../hooks/useWorkoutSessionData';

/**
 * Confirmation step for finishing the active session. On confirm the workout is
 * ended server-side, the current-workout cache is cleared, and the user is sent
 * to the finished workout's page.
 */
export default function EndWorkoutModal({
  session,
  onClose,
}: {
  session: WorkoutSession;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [saveAsRoutine, setSaveAsRoutine] = useState(true);
  // Guards against creating a duplicate routine if the save succeeds but
  // ending the workout fails and the user retries.
  const routineSaved = useRef(false);

  const {
    mutateAsync: createRoutine,
    isPending: isSavingRoutine,
    error: routineError,
  } = useCreateRoutine();
  const { mutate: endWorkout, isPending: isEnding, error } = useEndWorkout();

  const { exerciseCount, setCount, completedSetCount } =
    useWorkoutSessionData(session);

  const isPending = isSavingRoutine || isEnding;
  const unloggedSets = (setCount ?? 0) - (completedSetCount ?? 0);

  const handleConfirm = async () => {
    // Save the template first: if it fails the workout stays open, so nothing
    // is lost and the user can retry or opt out.
    if (saveAsRoutine && !routineSaved.current) {
      try {
        await createRoutine(routineFromSession(session));
        routineSaved.current = true;
      } catch {
        return; // surfaced below
      }
    }

    endWorkout(undefined, {
      onSuccess: (endedWorkout) => {
        onClose();
        navigate(`/workout/${endedWorkout._id}`);
      },
    });
  };

  return (
    <Modal
      subHeading="End Workout"
      mainHeading="Finish this session?"
      description="Your logged sets are saved. You won't be able to add to this session once it's ended."
      onClose={isPending ? undefined : onClose}
    >
      <div className="flex flex-col gap-6">
        {/* What's being finished */}
        <div className="flex flex-wrap gap-3">
          <Stat label="Exercises" value={exerciseCount ?? 0} />
          <Stat
            label="Sets Logged"
            value={`${completedSetCount ?? 0}/${setCount ?? 0}`}
          />
        </div>

        {unloggedSets > 0 && (
          <p className="body-text text-sm! text-[var(--contrast-three)]">
            {unloggedSets} set{unloggedSets === 1 ? '' : 's'}{' '}
            {unloggedSets === 1 ? 'is' : 'are'} still unlogged and will be saved
            as incomplete.
          </p>
        )}

        {/* Opt out of keeping this session as a reusable template */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-3">
          <input
            type="checkbox"
            checked={saveAsRoutine}
            disabled={isPending}
            onChange={(e) => setSaveAsRoutine(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--accent-primary)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-bold text-white">
              Save to my routines
            </span>
            <span className="block text-xs text-[var(--contrast-three)]">
              Keep these exercises and sets as a reusable template you can start
              from next time.
            </span>
          </span>
        </label>

        {routineError && (
          <p className="body-text text-sm! text-[var(--accent-primary)]">
            Couldn't save the routine: {routineError.message}. Your workout is
            still open — try again, or untick the box to finish without saving.
          </p>
        )}

        {error && (
          <p className="body-text text-sm! text-[var(--accent-primary)]">
            Couldn't end the workout: {error.message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Keep Going
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="anton flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaStop />
            {isSavingRoutine
              ? 'Saving routine…'
              : isEnding
                ? 'Ending…'
                : 'End Workout'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-2">
      <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </span>
      <span className="anton text-lg text-white">{value}</span>
    </div>
  );
}
