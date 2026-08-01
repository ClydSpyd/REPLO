import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { useDeleteRoutine } from '../../../mutations/routines';
import {
  formatLabel,
  getRoutineStats,
  muscleSubtitle,
  topMuscleGroups,
} from '../routine-utils';

/**
 * Read-only detail view for a saved routine: what it hits, how big it is, and
 * the prescribed sets per exercise. Footer actions are not wired up yet.
 */
export default function RoutineDetailModal({
  routine,
  onClose,
}: {
  routine: Routine;
  onClose: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const {
    mutate: deleteRoutine,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteRoutine();

  const { exerciseCount, setCount, totalVolume, estimatedMinutes } =
    getRoutineStats(routine);

  const muscles = topMuscleGroups(routine.exercises);
  const [primaryTag] = routine.tags ?? [];

  const handleDelete = () =>
    deleteRoutine(routine._id, { onSuccess: () => onClose() });

  return (
    <Modal
      mainHeading={routine.name}
      subHeading={
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {primaryTag && (
            <span className="rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold text-[var(--accent-primary)]">
              {primaryTag}
            </span>
          )}
          {muscles.length > 0 && (
            <span className="text-[var(--contrast-three)]">
              {muscles.map(formatLabel).join(' · ')}
            </span>
          )}
        </span>
      }
      onClose={confirmingDelete ? undefined : onClose}
      overlay={
        confirmingDelete && (
          <DeleteConfirmOverlay
            routineName={routine.name}
            isDeleting={isDeleting}
            error={deleteError?.message}
            onConfirm={handleDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        )
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="manrope text-sm font-bold text-red-400 transition-opacity hover:opacity-80"
          >
            Delete
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-3 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
            >
              Schedule
            </button>
            <button
              type="button"
              className="anton flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95"
            >
              <FaPlay className="text-xs" />
              Start Workout
            </button>
          </div>
        </div>
      }
    >
      {/* Summary figures */}
      <div className="-mt-1 mb-6 flex flex-wrap gap-x-8 gap-y-3 border-b border-[var(--contrast-one)] pb-6">
        <Stat value={exerciseCount} label="Exercises" />
        <Stat value={setCount} label="Sets" />
        <Stat value={totalVolume.toLocaleString()} label="kg Volume" />
        <Stat value={estimatedMinutes} label="Est. min" />
      </div>

      {/* Exercises */}
      {routine.exercises.length === 0 ? (
        <p className="space-mono rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-6 text-center text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          This routine has no exercises yet
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {routine.exercises.map((exercise, index) => (
            <section
              key={`${exercise.exerciseId}-${index}`}
              className="rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3 lg:gap-4">
                  <span className="anton flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--dark-two)] text-sm text-[var(--contrast-two)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <h3 className="heading-four truncate text-white">
                      {exercise.name}
                    </h3>
                    <p className="mt-1 truncate text-xs lg:text-sm text-[var(--contrast-three)]">
                      {muscleSubtitle(exercise)}
                    </p>
                  </div>
                </div>

                <span className="space-mono shrink-0 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
                  {exercise.sets.length} × sets
                </span>
              </div>

              {exercise.sets.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {exercise.sets.map((set, setIndex) => (
                    <span
                      key={setIndex}
                      className="space-mono rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] px-3 py-2 text-xs whitespace-nowrap text-[var(--contrast-two)]!"
                    >
                      {set.reps} × {set.weight}kg
                    </span>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </Modal>
  );
}

function DeleteConfirmOverlay({
  routineName,
  isDeleting,
  error,
  onConfirm,
  onCancel,
}: {
  routineName: string;
  isDeleting: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-[color-mix(in_srgb,var(--dark-two)_85%,transparent)] px-8 text-center backdrop-blur-sm">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/60 bg-red-400/10">
          <FiTrash2 className="text-xl text-red-400" />
        </div>
        <h4 className="heading-four text-white">Delete this routine?</h4>
        <p className="body-text max-w-md text-sm! text-[var(--contrast-three)]">
          {routineName} will be removed from your library. Workouts you've
          already done from it are not affected.
        </p>
      </div>

      {error && (
        <p className="body-text text-sm! text-red-400">
          Couldn't delete: {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="anton rounded-lg bg-red-500 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="anton text-2xl text-white">{value}</span>
      <span className="space-mono text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </span>
    </div>
  );
}
