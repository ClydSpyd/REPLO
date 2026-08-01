import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiLogOut, FiUser, FiX } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import { navItems } from '../../config/nav';

interface MobileNavSheetProps {
  /** Dismiss the sheet (backdrop, close button, Escape, or after navigating). */
  onClose: () => void;
  /** Sign the user out. */
  onLogout: () => void;
}

/**
 * Full-screen navigation sheet for small screens, sliding in from the right.
 * Primary destinations sit at the top; account actions are pinned to the
 * bottom. Rendered only below `lg` — the desktop header keeps its nav pills and
 * account dropdown.
 */
export default function MobileNavSheet({
  onClose,
  onLogout,
}: MobileNavSheetProps) {
  // Lock body scroll and close on Escape while mounted.
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
      className="animate-modal-backdrop fixed inset-0 z-50 bg-black/60 lg:hidden"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        onClick={(e) => e.stopPropagation()}
        className="animate-sheet-panel app-bg absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-[var(--contrast-one)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--contrast-one)] px-6 py-5">
          <p className="anotation">Menu</p>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Primary destinations */}
        <nav className="flex-1 overflow-y-auto px-6 py-6">
          <ul className="flex flex-col gap-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl border px-5 py-4 text-lg font-semibold transition-colors ${
                      isActive
                        ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]'
                        : 'border-[var(--contrast-one)] bg-[var(--dark-one)] text-white'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Account actions */}
        <div className="border-t border-[var(--contrast-one)] px-6 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base text-white transition-colors hover:bg-[var(--hint-primary-dark)]"
          >
            <FiUser className="text-xl text-[var(--contrast-three)]" />
            Account
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="mt-1 flex w-full items-center gap-4 rounded-xl px-5 py-4 text-left text-base text-white transition-colors hover:bg-[var(--hint-primary-dark)]"
          >
            <FiLogOut className="text-xl text-[var(--contrast-three)]" />
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
