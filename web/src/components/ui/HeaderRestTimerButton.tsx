import { Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { FaStopwatch } from 'react-icons/fa';
import { useMyCurrentWorkout } from '../../queries/workouts';
import { useRestTimer } from '../../hooks/useRestTimer';

/**
 * Rest-timer trigger for the global header. Shown only on the /workout route
 * while a session is active, and only below `lg` — from `lg` the trigger lives
 * next to "End Workout" in the desktop WorkoutSummary instead.
 *
 * The route gate is applied here so the suspending inner query only mounts (and
 * only fetches) on /workout; its own Suspense boundary keeps a pending fetch
 * from suspending the whole header.
 */
export default function HeaderRestTimerButton() {
  const location = useLocation();
  if (location.pathname !== '/workout') return null;

  return (
    <Suspense fallback={null}>
      <ActiveWorkoutRestTimerButton />
    </Suspense>
  );
}

function ActiveWorkoutRestTimerButton() {
  const { open } = useRestTimer();
  const { data: activeWorkout } = useMyCurrentWorkout();

  if (!activeWorkout) return null;

  return (
    <button
      type="button"
      aria-label="Open rest timer"
      onClick={open}
      className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] lg:hidden"
    >
      <FaStopwatch className="text-lg" />
    </button>
  );
}
