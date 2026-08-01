import { useEffect, useRef, useState } from 'react';
import { FiUser, FiLogOut, FiMenu } from 'react-icons/fi';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import BarsLogo from './BarsLogo';
import MobileNavSheet from './MobileNavSheet';
import { navItems } from '../../config/nav';

export default function ViewHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the popover on outside click or Escape.
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

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setMenuOpen(false);
    setSheetOpen(false);
    navigate('/login', { replace: true });
  };

  return (
    <div className="bg-transparent text-white px-4 py-3 shadow flex items-center justify-between">
      <div className="w-30">
        <Link to="/" className="flex gap-0 items-center">
          <BarsLogo
            size={43}
            barColors={['#E8A33D', '#E8821E', '#D2570D']}
            cornerRadius={5}
          />
          <h1 className="text-3xl font-extrabold text-white tracking-normal">
            REPLO
          </h1>
        </Link>
      </div>

      <nav className="flex-1 flex justify-center">
        <div className="hidden items-center gap-1 rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] p-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `rounded-md px-6 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-primary)] text-black'
                    : 'text-[var(--contrast-three)] hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="w-30 flex justify-end">
        {/* Mobile: hamburger opens the full-screen nav sheet */}
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)] md:hidden"
        >
          <FiMenu className="text-xl" />
        </button>

        {/* Desktop: account dropdown */}
        <div className="relative hidden md:block" ref={menuRef}>
          <button
            type="button"
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--accent-primary)] transition-colors hover:border-[var(--accent-primary)]"
          >
            <FiUser className="text-xl" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-one)] shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[var(--hint-primary-dark)]"
              >
                <FiUser className="text-base text-[var(--contrast-three)]" />
                Account
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-2.5 text-left text-sm text-white transition-colors hover:bg-[var(--hint-primary-dark)]"
              >
                <FiLogOut className="text-base text-[var(--contrast-three)]" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {sheetOpen && (
        <MobileNavSheet
          onClose={() => setSheetOpen(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
