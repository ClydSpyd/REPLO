import { useState } from 'react';
import { FaPlay } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import { RoutineActionMenu } from './RoutineCard';
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
  onEdit,
  onDuplicate,
  handleStart,
  isDuplicating = false,
}: {
  routine: Routine;
  onClose: () => void;
  /** Edit/duplicate handlers back the mobile ⋯ menu (desktop keeps it on the card). */
  onEdit?: () => void;
  onDuplicate?: () => void;
  handleStart: () => void;
  isDuplicating?: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const {
    mutate: deleteRoutine,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteRoutine();

  const { exerciseCount, setCount, estimatedMinutes } =
    getRoutineStats(routine);

  const muscles = topMuscleGroups(routine.exercises);
  const [primaryTag] = routine.tags ?? [];

  const handleDelete = () =>
    deleteRoutine(routine._id, { onSuccess: () => onClose() });

  // Tag pill only — the muscle summary now lives in the collapsible details.
  // Rendered by the shared Modal header on lg, and by the in-content mobile
  // header below lg (where that header is hidden).
  const eyebrow = primaryTag ? (
    <span className="inline-flex rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold text-[var(--accent-primary)]">
      {primaryTag}
    </span>
  ) : null;

  return (
    <Modal
      mainHeading={routine.name}
      subHeading={eyebrow}
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
        <div className="flex items-center gap-3">
          {/* Mobile: the ⋯ menu (edit/duplicate/delete) that used to sit on the
              card. Desktop keeps that menu on the card, so here it's just the
              delete shortcut. */}
          {onEdit && onDuplicate && (
            <div className="lg:hidden">
              <RoutineActionMenu
                routineName={routine.name}
                isDuplicating={isDuplicating}
                direction="up"
                align="left"
                onEdit={onEdit}
                onDuplicate={onDuplicate}
                onDelete={() => setConfirmingDelete(true)}
                triggerClassName="h-12 w-12 rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] hover:border-[var(--accent-primary)] hover:text-[var(--text-strong)]"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            aria-label="Delete routine"
            className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-400/50 text-red-400 transition-colors hover:border-red-400 hover:bg-red-400/10 lg:flex"
          >
            <FiTrash2 className="text-lg" />
          </button>

          <button
            type="button"
            disabled
            className="space-mono flex-1 rounded-lg border border-[var(--contrast-one)] px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] pointer-events-none opacity-40"
          >
            Schedule
          </button>
          <button
            onClick={handleStart}
            type="button"
            className="anton flex flex-[1.6] items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3.5 text-sm font-extrabold uppercase tracking-wide text-[var(--text-contrast)] transition-colors hover:brightness-95"
          >
            <FaPlay className="text-xs" />
            Start
          </button>
        </div>
      }
    >
      {/* Mobile header — the shared Modal hides its own header below lg. */}
      <div className="mb-6 pr-12 lg:hidden">
        <div className="space-mono text-xs uppercase tracking-wide text-[var(--accent-primary)]">
          {eyebrow}
        </div>
        <h2 className="heading-three mt-3">{routine.name}</h2>
      </div>

      {/* Summary line + collapsible detail figures */}
      <div className="-mt-1 mb-6 border-b border-[var(--contrast-one)] pb-6">
        <div className="flex items-center justify-between gap-3">
          <p className="space-mono text-sm text-[var(--contrast-three)]">
            <span className="font-bold text-[var(--text-strong)]">
              {exerciseCount}
            </span>{' '}
            exercises
            {/* {' · '}
            <span className="font-bold text-[var(--text-strong)]">
              ~{estimatedMinutes}
            </span>{' '}
            min */}
          </p>

          <button
            type="button"
            onClick={() => setShowDetails((open) => !open)}
            aria-expanded={showDetails}
            className="space-mono flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:text-[var(--text-strong)]"
          >
            {showDetails ? 'Hide' : 'Details'}
            {showDetails ? <FiChevronUp /> : <FiChevronDown />}
          </button>
        </div>

        {showDetails && (
          <div className="mt-5">
            <div className="grid grid-cols-2 gap-3">
              {/* <StatCard value={exerciseCount} label="Exercises" /> */}
              <StatCard value={setCount} label="Sets" />
              {/* <StatCard
                value={totalVolume.toLocaleString()}
                label="kg Volume"
              /> */}
              <StatCard value={estimatedMinutes} label="Est. min" />
            </div>

            {muscles.length > 0 && (
              <div className="mt-4">
                <p className="space-mono mb-2 text-[10px] uppercase tracking-wide text-[var(--contrast-three)]!">
                  Targets
                </p>
                <p className="space-mono text-xs uppercase tracking-wide text-[var(--text-strong)]">
                  {muscles.map(formatLabel).join(' · ')}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercises */}
      {routine.exercises.length === 0 ? (
        <p className="space-mono rounded-lg border border-dashed border-[var(--contrast-one)] px-5 py-6 text-center text-xs uppercase tracking-wide text-[var(--contrast-three)]">
          This routine has no exercises yet
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {routine.exercises.map((exercise, index) => (
            <section
              key={`${exercise.exerciseId}-${index}`}
              className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 lg:p-5"
            >
              <div className="flex min-w-0 items-start gap-3 lg:gap-4">
                <span className="anton flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--dark-two)] text-sm text-[var(--contrast-two)]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <h3 className="heading-four truncate text-[var(--text-strong)]">
                    {exercise.name}
                  </h3>
                  <p className="mt-1 truncate text-xs lg:text-sm text-[var(--accent-primary)]">
                    {muscleSubtitle(exercise)}
                  </p>
                </div>
              </div>

              <h3 className="space-mono shrink-0 text-base font-bold uppercase tracking-wide text-[var(--accent-primary)]">
                <span className="lowercase">x</span>
                {exercise.sets.length}
              </h3>
              {/* {exercise.sets.length > 0 && (
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
              )} */}
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
        <h4 className="heading-four text-[var(--text-strong)]">Delete this routine?</h4>
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
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="anton rounded-lg bg-red-500 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-5 py-4">
      <div className="anton text-3xl leading-none text-[var(--text-strong)]">{value}</div>
      <div className="space-mono mt-2 text-xs uppercase tracking-wide text-[var(--contrast-three)]!">
        {label}
      </div>
    </div>
  );
}
