import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlay } from 'react-icons/fa';
import {
  FiCopy,
  FiEdit2,
  FiMoreHorizontal,
  FiStar,
  FiTrash2,
} from 'react-icons/fi';
import RoutineDetailModal from './RoutineDetailModal';
import RoutineBuilderModal from './RoutineBuilderModal';
import { useToast } from '../../../hooks/useToast';
import { useCreateRoutine, useDeleteRoutine } from '../../../mutations/routines';
import { useStartWorkoutFromRoutine } from '../../../mutations/workouts';
import {
  formatLabel,
  formatLastPerformed,
  getRoutineStats,
  routineToDuplicateInput,
  topMuscleGroups,
} from '../routine-utils';

/**
 * One saved routine in the library: identity, what it hits, how big it is, and
 * when it was last performed.
 */
export default function RoutineCard({ routine }: { routine: Routine }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    mutate: deleteRoutine,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteRoutine();
  const { mutate: createRoutine, isPending: isDuplicating } = useCreateRoutine();
  const { mutate: startWorkout, isPending: isStarting } =
    useStartWorkoutFromRoutine();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const { exerciseCount, estimatedMinutes: minutes } = getRoutineStats(routine);

  const muscles = topMuscleGroups(routine.exercises);
  const [primaryTag] = routine.tags ?? [];

  const handleStart = () =>
    startWorkout(routine, {
      // Runs after the current-workout refetch resolves, so the workout view
      // has its session ready on arrival.
      onSuccess: () => {
        success('Workout started', routine.name);
        navigate('/workout');
      },
      onError: (err) => toastError("Couldn't start workout", err.message),
    });

  const handleDuplicate = () => {
    setMenuOpen(false);
    createRoutine(routineToDuplicateInput(routine), {
      onSuccess: (created) => success('Routine duplicated', created.name),
      onError: (err) => toastError("Couldn't duplicate routine", err.message),
    });
  };

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-5">
      {confirmingDelete && (
        <DeleteConfirmOverlay
          routineName={routine.name}
          isDeleting={isDeleting}
          error={deleteError?.message}
          onConfirm={() =>
            deleteRoutine(routine._id, {
              onSuccess: () => success('Routine deleted', routine.name),
            })
          }
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {/* Tag + card actions */}
      <div className="flex items-start justify-between gap-2">
        {primaryTag ? (
          <span className="space-mono rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)]">
            {primaryTag}
          </span>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {/* Favourites aren't backed by the API yet */}
          <FiStar aria-hidden="true" className="text-[var(--contrast-two)]" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label={`Actions for ${routine.name}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--contrast-two)] transition-colors hover:bg-[var(--dark-two)] hover:text-white"
            >
              <FiMoreHorizontal />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setEditOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[var(--hint-primary-dark)]"
                >
                  <FiEdit2 className="text-base text-[var(--contrast-three)]" />
                  Edit
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleDuplicate}
                  disabled={isDuplicating}
                  className="flex w-full items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[var(--hint-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiCopy className="text-base text-[var(--contrast-three)]" />
                  {isDuplicating ? 'Duplicating…' : 'Duplicate'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmingDelete(true);
                  }}
                  className="flex w-full items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-400/10"
                >
                  <FiTrash2 className="text-base" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="heading-four mt-3 truncate text-white">{routine.name}</h3>

      {/* Muscle coverage */}
      {muscles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {muscles.map((muscle) => (
            <span
              key={muscle}
              className="rounded-full border border-[var(--contrast-one)] bg-[var(--dark-two)] px-3 py-1 text-xs text-[var(--contrast-three)]"
            >
              {formatLabel(muscle)}
            </span>
          ))}
        </div>
      )}

      {/* Size + recency */}
      <div className="mt-4 flex flex-col gap-1.5">
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          <span className="px-2">·</span>~{minutes} min
        </p>
        <p className="space-mono text-xs text-[var(--contrast-three)]">
          Last<span className="px-2">·</span>
          {formatLastPerformed(routine.lastPerformed)}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[var(--contrast-one)] pt-5">
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting}
          className="anton flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaPlay className="text-xs" />
          {isStarting ? 'Starting…' : 'Start'}
        </button>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]"
        >
          View
        </button>
      </div>

      {editOpen && (
        <RoutineBuilderModal
          routine={routine}
          onClose={() => setEditOpen(false)}
        />
      )}

      {detailOpen && (
        <RoutineDetailModal
          routine={routine}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </section>
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
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-[color-mix(in_srgb,var(--dark-one)_88%,transparent)] px-5 text-center backdrop-blur-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/60 bg-red-400/10">
        <FiTrash2 className="text-lg text-red-400" />
      </div>

      <div>
        <h4 className="heading-four text-white">Delete routine?</h4>
        <p className="body-text mt-1 text-sm! text-[var(--contrast-three)]">
          {routineName} will be removed from your library.
        </p>
      </div>

      {error && (
        <p className="body-text text-xs! text-red-400">
          Couldn't delete: {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isDeleting}
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="anton rounded-lg bg-red-500 px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
