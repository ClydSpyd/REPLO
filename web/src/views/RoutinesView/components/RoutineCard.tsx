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
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useCreateRoutine, useDeleteRoutine } from '../../../mutations/routines';
import { useToggleFavorite } from '../../../mutations/favorites';
import { useStartWorkoutFromRoutine } from '../../../mutations/workouts';
import {
  formatLabel,
  formatLastPerformed,
  getRoutineStats,
  routineToDuplicateInput,
  topMuscleGroups,
} from '../routine-utils';

/**
 * One saved routine in the library. Two layouts share all state/actions: a
 * compact horizontal row on mobile (tag + title + size, with a prominent start
 * button and tucked-away favorite/menu) and the full card from `sm` up. The
 * layout is media-query driven so only one mounts, keeping the menu's
 * outside-click handling to a single instance.
 */
export default function RoutineCard({
  routine,
  isFavorite = false,
}: {
  routine: Routine;
  isFavorite?: boolean;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const isCompact = !useMediaQuery('(min-width: 640px)');

  const {
    mutate: deleteRoutine,
    isPending: isDeleting,
    error: deleteError,
  } = useDeleteRoutine();
  const { mutate: createRoutine, isPending: isDuplicating } = useCreateRoutine();
  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useToggleFavorite();
  const { mutate: startWorkout, isPending: isStarting } =
    useStartWorkoutFromRoutine();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

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

  const handleToggleFavorite = () => {
    toggleFavorite(
      { routineId: routine._id, isFavorite },
      {
        onError: (err) => toastError("Couldn't update favorite", err.message),
      },
    );
  };

  const handleDuplicate = () => {
    createRoutine(routineToDuplicateInput(routine), {
      onSuccess: (created) => success('Routine duplicated', created.name),
      onError: (err) => toastError("Couldn't duplicate routine", err.message),
    });
  };

  const deleteOverlay = confirmingDelete && (
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
  );

  const favoriteButton = (
    <FavoriteButton
      isFavorite={isFavorite}
      isPending={isTogglingFavorite}
      routineName={routine.name}
      onToggle={handleToggleFavorite}
    />
  );

  const actionMenu = (
    <RoutineActionMenu
      routineName={routine.name}
      isDuplicating={isDuplicating}
      onEdit={() => setEditOpen(true)}
      onDuplicate={handleDuplicate}
      onDelete={() => setConfirmingDelete(true)}
    />
  );

  const modals = (
    <>
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
          isDuplicating={isDuplicating}
          onEdit={() => {
            setDetailOpen(false);
            setEditOpen(true);
          }}
          onDuplicate={handleDuplicate}
        />
      )}
    </>
  );

  if (isCompact) {
    return (
      <section className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] py-4 pl-5 pr-4">
        {deleteOverlay}

        {/* Accent edge */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-[var(--accent-primary)]"
        />

        {/* Identity — tap to view details */}
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          aria-label={`View ${routine.name}`}
          className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left"
        >
          {primaryTag && (
            <span className="space-mono rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)]">
              {primaryTag}
            </span>
          )}
          <h3 className="heading-four max-w-full truncate text-[var(--text-strong)]">
            {routine.name}
          </h3>
          <p className="space-mono text-xs text-[var(--contrast-three)]">
            {exerciseCount}{' '}
            {isCompact ? 'ex' : `exercise${exerciseCount === 1 ? '' : 's'}`}
            <span className="px-2">·</span>~{minutes} min
          </p>
        </button>

        {/* Actions — the ⋯ menu lives in the detail modal on mobile. */}
        <div className="flex shrink-0 items-center gap-1">
          {favoriteButton}
          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            aria-label={`Start ${routine.name}`}
            className="ml-1 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)] hover:ntext-[var(--text-contrast)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaPlay className="text-sm" />
          </button>
        </div>

        {modals}
      </section>
    );
  }

  return (
    <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-5">
      {deleteOverlay}

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
          {favoriteButton}
          {actionMenu}
        </div>
      </div>

      <h3 className="heading-four mt-3 truncate text-[var(--text-strong)]">
        {routine.name}
      </h3>

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
          className="anton flex flex-1 items-center justify-center gap-2 rounded-lg bg-[var(--accent-primary)] px-4 py-3 text-sm font-extrabold uppercase tracking-wide ntext-[var(--text-contrast)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
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

      {modals}
    </section>
  );
}

/** Favorite toggle — a star that fills when the routine is favorited. */
function FavoriteButton({
  isFavorite,
  isPending,
  routineName,
  onToggle,
}: {
  isFavorite: boolean;
  isPending: boolean;
  routineName: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={
        isFavorite
          ? `Remove ${routineName} from favorites`
          : `Add ${routineName} to favorites`
      }
      aria-pressed={isFavorite}
      onClick={onToggle}
      disabled={isPending}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--dark-two)] disabled:cursor-not-allowed disabled:opacity-60 ${
        isFavorite
          ? 'text-[var(--accent-primary)]'
          : 'text-[var(--contrast-two)] hover:text-[var(--text-strong)]'
      }`}
    >
      <FiStar fill={isFavorite ? 'currentColor' : 'none'} />
    </button>
  );
}

/**
 * The ⋯ overflow menu (edit / duplicate / delete). Owns its own open state and
 * outside-click/Escape handling so each mounted card has exactly one instance.
 * `direction` flips the dropdown above the trigger — needed when it sits in a
 * bottom-pinned surface like the detail modal's footer.
 */
export function RoutineActionMenu({
  routineName,
  isDuplicating,
  onEdit,
  onDuplicate,
  onDelete,
  direction = 'down',
  triggerClassName = 'h-8 w-8 rounded-md text-[var(--contrast-two)] hover:bg-[var(--dark-two)] hover:text-[var(--text-strong)]',
}: {
  routineName: string;
  isDuplicating: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  direction?: 'down' | 'up';
  /** Overrides trigger sizing/skin — e.g. a larger bordered button in a footer. */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${routineName}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center justify-center transition-colors ${triggerClassName}`}
      >
        <FiMoreHorizontal />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-20 w-44 overflow-hidden rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] shadow-lg ${
            direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--text-strong)] transition-colors hover:bg-[var(--hint-primary-dark)]"
          >
            <FiEdit2 className="text-base text-[var(--contrast-three)]" />
            Edit
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDuplicate();
            }}
            disabled={isDuplicating}
            className="flex w-full items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-2.5 text-left text-sm text-[var(--text-strong)] transition-colors hover:bg-[var(--hint-primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiCopy className="text-base text-[var(--contrast-three)]" />
            {isDuplicating ? 'Duplicating…' : 'Duplicate'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-400/10"
          >
            <FiTrash2 className="text-base" />
            Delete
          </button>
        </div>
      )}
    </div>
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
        <h4 className="heading-four text-[var(--text-strong)]">Delete routine?</h4>
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
          className="space-mono rounded-lg border border-[var(--contrast-one)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="anton rounded-lg bg-red-500 px-5 py-2 text-sm font-extrabold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
