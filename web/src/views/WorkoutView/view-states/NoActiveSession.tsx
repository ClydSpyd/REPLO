import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  FiChevronRight,
  FiEdit2,
  FiLayers,
  FiPlus,
  FiStar,
  FiX,
} from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa';
import BarsLogo from '../../../components/ui/BarsLogo';
import RoutineBuilderModal from '../../RoutinesView/components/RoutineBuilderModal';
import { useMyRoutines } from '../../../queries/routines';
import { useFavorites } from '../../../queries/favorites';
import { useStartWorkoutFromRoutine } from '../../../mutations/workouts';
import { useToast } from '../../../hooks/useToast';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { getRoutineStats } from '../../RoutinesView/routine-utils';

/**
 * Landing state for the workout view when the user has no session in progress.
 * Offers the ways into a workout; "from routine library" expands the favorites
 * shortcut below.
 */
export default function NoActiveSession() {
  const navigate = useNavigate();
  const [showFavorites, setShowFavorites] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="w-full flex flex-col items-center justify-center px-6 py-12 lg:py-20">
      {/* Mark */}
      <div className="flex h-[80px] w-[80px] lg:h-[104px] lg:w-[104px] items-center justify-center rounded-3xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)]">
        <BarsLogo
          size={isDesktop ? 52 : 40}
          barColors={['#E8A33D', '#E8821E', '#D2570D']}
          cornerRadius={5}
        />
      </div>

      <p className="anotation mt-5 text-[var(--accent-primary)]!">
        No active session
      </p>

      <h1 className="hidden lg:block anton mt-2 text-center text-6xl lg:text-8xl uppercase text-white">
        Nothing on the bar
      </h1>

      <p className="body-text mt-4 max-w-[640px] text-center text-[var(--contrast-three)]">
        The rack's empty right now. Pick how you want to train today — jump
        straight in, load a saved routine, or build a new one before you start.
      </p>

      {/* Entry points */}
      <div className="mt-10 grid w-full max-w-[1180px] grid-cols-1 gap-3 lg:mt-12 lg:grid-cols-3 lg:gap-5">
        <OptionCard
          icon={<FiPlus />}
          title="Start on the fly"
          description="Launch an empty session and add exercises as you lift."
          cta="Start now"
          highlighted
          onClick={() => navigate('/workout?create=true')}
        />
        <OptionCard
          icon={<FiLayers />}
          title={isDesktop ? "From routine library":"From library"}
          description="Load a saved plan and start lifting instantly."
          cta="Browse routines"
          expanded={showFavorites}
          onClick={() => setShowFavorites((open) => !open)}
        />
        <OptionCard
          icon={<FiEdit2 />}
          title="Build a routine"
          description="Design a reusable plan, then launch it here."
          cta="Create new"
          onClick={() => setShowBuilder(true)}
        />
      </div>

      {showFavorites && (
        <FavoritesSection
          onClose={() => setShowFavorites(false)}
          onBrowseAll={() => navigate('/routines')}
        />
      )}

      {showBuilder && (
        <RoutineBuilderModal onClose={() => setShowBuilder(false)} />
      )}
    </div>
  );
}

/**
 * The favorites shortcut. Presentation is viewport-driven: inline under the
 * entry-point cards on desktop, and a full-viewport modal on mobile where an
 * inline panel would bury the cards. The 1024px breakpoint is Tailwind's `lg`.
 */
function FavoritesSection({
  onClose,
  onBrowseAll,
}: {
  onClose: () => void;
  onBrowseAll: () => void;
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isDesktop) {
    return (
      <div className="mt-6 w-full max-w-[1180px] rounded-2xl border border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6">
        <FavoritesContent onBrowseAll={onBrowseAll} />
      </div>
    );
  }

  return (
    <FavoritesModal onClose={onClose}>
      <FavoritesContent onBrowseAll={onBrowseAll} />
    </FavoritesModal>
  );
}

/**
 * The favorites body, layout-agnostic so it drops into either the desktop panel
 * or the mobile modal: the user's favorited routines as one-tap starts, plus a
 * link into the full library (or an empty-state nudge).
 */
function FavoritesContent({ onBrowseAll }: { onBrowseAll: () => void }) {
  const { data: routines, isLoading, error } = useMyRoutines();
  const { data: favoriteIds } = useFavorites();

  const favorites = (routines ?? []).filter((routine) =>
    favoriteIds?.has(routine._id),
  );
  const savedCount = routines?.length ?? 0;
  const isEmpty = !isLoading && !error && favorites.length === 0;

  if (isEmpty) {
    return <EmptyFavorites onBrowseAll={onBrowseAll} />;
  }

  return (
    <>
      <p className="space-mono flex items-center gap-2 text-xs uppercase tracking-wide text-[var(--accent-primary)]">
        <FiStar aria-hidden="true" fill="currentColor" />
        Favorites
      </p>

      <div className="mt-4">
        {isLoading && <FavoritesPlaceholder text="Loading your routines…" />}

        {error && (
          <FavoritesPlaceholder
            text={`Couldn't load routines: ${error.message}`}
          />
        )}

        {favorites.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((routine) => (
              <FavoriteRoutineCard key={routine._id} routine={routine} />
            ))}
          </div>
        )}
      </div>

      {/* Link into the full catalogue */}
      {favorites.length > 0 && (
        <button
          type="button"
          onClick={onBrowseAll}
          className="mt-4 flex w-full items-center gap-4 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-3.5 text-left transition-colors hover:border-[var(--accent-primary)]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] text-white">
            <FiLayers />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold text-white">
              Full routine library
            </span>
            <span className="space-mono block text-xs uppercase tracking-tight! text-[var(--accent-primary)]">
              {savedCount} saved
            </span>
          </span>
          <FiChevronRight className="text-[var(--contrast-two)]" />
        </button>
      )}
    </>
  );
}

/**
 * Full-viewport mobile modal, portaled to body with a scroll lock and Escape
 * handler — mirroring MobileNavSheet. The content supplies its own titling, so
 * the top bar carries only the close affordance.
 */
function FavoritesModal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Favorite routines"
      className="fixed inset-0 z-50 flex flex-col bg-[var(--dark-one)]"
    >
      <div className="flex justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          aria-label="Close favorites"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
        >
          <FiX className="text-xl" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Shown when the user has no favorited routines: a nudge to star one, with a
 * direct route into the library to browse or build their first plan.
 */
function EmptyFavorites({ onBrowseAll }: { onBrowseAll: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-2xl text-[var(--accent-primary)]">
        <FiStar />
      </div>

      <h3 className="anton mt-6 text-3xl uppercase tracking-wide text-white">
        No saved routines yet
      </h3>

      <p className="body-text mt-3 max-w-[420px] text-sm! text-[var(--contrast-three)]">
        Star a routine to pin it here for one-tap loading — or build your first
        plan in the routine library.
      </p>

      <button
        type="button"
        onClick={onBrowseAll}
        className="anton mt-6 flex items-center gap-2 rounded-lg bg-[var(--accent-primary)] px-6 py-3 text-sm font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95"
      >
        <FiLayers />
        Open routine library
      </button>
    </div>
  );
}

/**
 * Compact favorite: identity + size, with a one-tap start. Owns its own start
 * mutation so each card reports its own pending state (mirrors RoutineCard).
 */
function FavoriteRoutineCard({ routine }: { routine: Routine }) {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { mutate: startWorkout, isPending: isStarting } =
    useStartWorkoutFromRoutine();

  const { exerciseCount, estimatedMinutes: minutes } =
    getRoutineStats(routine);
  const [primaryTag] = routine.tags ?? [];

  const handleStart = () =>
    startWorkout(routine, {
      onSuccess: () => {
        success('Workout started', routine.name);
        navigate('/workout');
      },
      onError: (err) => toastError("Couldn't start workout", err.message),
    });

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-4">
      <div className="min-w-0">
        {primaryTag && (
          <span className="space-mono rounded-full border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--accent-primary)]">
            {primaryTag}
          </span>
        )}
        <h4 className="anton mt-2 truncate text-lg uppercase tracking-wide text-white">
          {routine.name}
        </h4>
        <p className="space-mono mt-1 text-xs text-[var(--contrast-three)]">
          {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
          <span className="px-2">·</span>~{minutes} min
        </p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={isStarting}
        aria-label={`Start ${routine.name}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-primary)] text-black transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <FaPlay className="text-sm" />
      </button>
    </div>
  );
}

function FavoritesPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex w-full items-center justify-center rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-6">
      <p className="anotation text-center text-xs! uppercase tracking-wide text-[var(--contrast-two)]!">
        {text}
      </p>
    </div>
  );
}

interface OptionCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  cta: string;
  /** Primary option — accented border and icon tile. */
  highlighted?: boolean;
  /** When set, the card toggles a disclosure — reflected as aria-expanded. */
  expanded?: boolean;
  /** Omit to render an inert card (not yet wired up). */
  onClick?: () => void;
}

function OptionCard({
  icon,
  title,
  description,
  cta,
  highlighted = false,
  expanded,
  onClick,
}: OptionCardProps) {
  const interactive = Boolean(onClick);

  const content = (
    <>
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl lg:h-[68px] lg:w-[68px] lg:text-2xl ${
          highlighted
            ? 'bg-[var(--accent-primary)] text-black'
            : 'border border-[var(--contrast-one)] bg-[var(--dark-two)] text-white'
        }`}
      >
        {icon}
      </div>

      {/* Row body on mobile; stacked card body from lg. */}
      <div className="min-w-0 flex-1 lg:flex-none">
        <h3 className="anton text-xl uppercase tracking-wide text-white lg:mt-8 lg:text-2xl">
          {title}
        </h3>

        <p className="body-text mt-1 text-xs! text-[var(--contrast-three)] lg:mt-3 lg:text-sm!">
          {description}
        </p>

        {/* CTA is desktop-only; mobile uses the trailing chevron. */}
        <span
          className={`space-mono mt-8 hidden items-center gap-1.5 text-xs uppercase tracking-wide lg:flex ${
            highlighted
              ? 'text-[var(--accent-primary)]'
              : 'text-[var(--contrast-three)]'
          }`}
        >
          {cta}
          <FiChevronRight />
        </span>
      </div>

      <FiChevronRight className="shrink-0 text-xl text-[var(--contrast-two)] lg:hidden" />
    </>
  );

  const className = `flex flex-row items-center gap-4 rounded-2xl border p-4 text-left transition-colors lg:flex-col lg:items-start lg:gap-0 lg:p-8 ${
    highlighted
      ? 'border-[var(--accent-primary)] bg-grad'
      : 'border-[var(--contrast-one)] bg-[var(--dark-one)]'
  } ${
    interactive
      ? 'cursor-pointer hover:border-[var(--accent-primary)]'
      : 'cursor-default opacity-80'
  }`;

  if (!interactive) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={className}
    >
      {content}
    </button>
  );
}
