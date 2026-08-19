import { HiSparkles } from 'react-icons/hi2';
import { useCoachStore } from '../../stores/coach-store';

/**
 * Floating launcher for the coach, pinned bottom-right on every page.
 * A dark tile with a sparkle, wrapped by a sweeping accent trail (see the
 * `.coach-fab-trail` rules in index.css). Hidden while the drawer is open.
 */
export default function CoachFab() {
  const isOpen = useCoachStore((s) => s.isOpen);
  const open = useCoachStore((s) => s.open);

  if (isOpen) return null;

  return (
    <button
      type="button"
      aria-label="Open REPLO AI coach"
      onClick={open}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 overflow-hidden rounded-2xl p-[2px] shadow-lg shadow-black/30"
    >
      <span className="coach-fab-trail" aria-hidden="true" />
      <span className="relative z-10 flex h-full w-full items-center justify-center rounded-[14px] bg-[var(--dark-one)] text-[var(--accent-primary)] border border-transparent hover:border-[var(--hint-primary-light)] transition-colors duration-300 ease-out">
        <HiSparkles className="text-2xl" />
      </span>
    </button>
  );
}
