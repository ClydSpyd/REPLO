import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FiChevronLeft, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useWorkout } from '../../queries/workouts';
import { useDeleteWorkout, useRepeatWorkout } from '../../mutations/workouts';
import { useToast } from '../../context/toast';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import CompletedSummary from './components/CompletedSummary';
import CompletedExerciseCard from './components/CompletedExerciseCard';
import VolumeByMuscle from './components/VolumeByMuscle';

/**
 * Review a completed workout: headline stats, per-muscle volume, and a full
 * exercise-by-exercise breakdown, with actions to repeat or delete the session.
 */
export default function WorkoutReview() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: workout, isLoading, error } = useWorkout(workoutId);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const {
    mutate: deleteWorkout,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteWorkout();
  const { mutate: repeatWorkout, isPending: isRepeating } = useRepeatWorkout();

  const handleDelete = () => {
    if (!workout) return;
    deleteWorkout(workout._id, {
      onSuccess: () => {
        toast.success('Session deleted');
        navigate('/sessions');
      },
    });
  };

  const handleRepeat = () => {
    if (!workout) return;
    repeatWorkout(workout, {
      onSuccess: () => {
        toast.success('Workout started', workout.name);
        navigate('/workout');
      },
      onError: (err) =>
        toast.error("Couldn't start workout", (err as Error).message),
    });
  };

  return (
    <ErrorBoundaryModal pageType="WorkoutReview">
      <div className="page-wrapper">
        <div className="w-full px-6 lg:px-2 py-6">
          <Link
            to="/sessions"
            className="space-mono inline-flex items-center gap-1 text-xs uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:text-[var(--text-strong)]"
          >
            <FiChevronLeft /> All sessions
          </Link>

          <div className="mt-4">
            {isLoading && <Placeholder text="Loading workout..." />}

            {error && (
              <Placeholder
                text={`Couldn't load this workout: ${error.message}`}
              />
            )}

            {!isLoading && !error && !workout && (
              <Placeholder text="Workout not found" />
            )}

            {workout && (
              <div className="flex flex-col gap-6 pb-28">
                <CompletedSummary session={workout} />

                {/* Personal records for this session go here — deferred until we
                    can derive per-session PRs. */}

                <VolumeByMuscle session={workout} />

                <div>
                  <p className="space-mono mb-3 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
                    Exercise breakdown
                  </p>

                  {workout.exercises.length === 0 ? (
                    <Placeholder text="No exercises were logged in this session" />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {workout.exercises.map((exercise, index) => (
                        <CompletedExerciseCard
                          key={`${exercise.exerciseId}-${index}`}
                          exercise={exercise}
                          index={index}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        {workout && (
          <div className="sticky bottom-0 z-10 border-t border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--surface-base)_88%,transparent)] px-6 py-4 backdrop-blur lg:px-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Delete session"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-red-400/60 hover:text-red-400"
              >
                <FiTrash2 className="text-lg" />
              </button>

              <div className="flex flex-1 items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleRepeat}
                  disabled={isRepeating}
                  className="space-mono flex items-center gap-2 rounded-lg border border-[var(--contrast-one)] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FiRefreshCw className={isRepeating ? 'animate-spin' : ''} />
                  {isRepeating ? 'Starting…' : 'Repeat workout'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/sessions')}
                  className="anton rounded-lg bg-[var(--accent-primary)] px-8 py-3 text-sm font-extrabold uppercase tracking-wide text-[var(--text-contrast)] transition-colors hover:brightness-95"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {confirmingDelete && workout && (
        <ConfirmDialog
          title="Delete this session?"
          message={`"${workout.name}" and its logged sets will be permanently removed. Your personal records and stats will update to reflect this.`}
          confirmLabel="Delete"
          isPending={isDeleting}
          error={deleteError?.message}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </ErrorBoundaryModal>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full grow rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6 flex items-center justify-center">
      <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide">
        {text}
      </p>
    </div>
  );
}
