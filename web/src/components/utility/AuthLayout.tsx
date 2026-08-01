import { Outlet } from 'react-router-dom';
import BarsLogo from '../ui/BarsLogo';

/**
 * Shared layout for the auth routes (login + signup). The left section holds
 * the elements common to both routes; the fixed-width right section renders the
 * route-specific content via <Outlet />.
 */
const AuthLayout = () => {
  return (
    <div className="app-bg flex min-h-screen w-screen">
      {/* Left: common across every auth route */}
      <section className="hidden flex-1 flex-col justify-between p-12 lg:flex">
        <div className="flex items-center gap-3">
          <BarsLogo
            size={36}
            barColors={['#e8a13c', '#e8823c', '#d9662a']}
            cornerRadius={3}
          />
          <h1 className="text-3xl font-extrabold text-white tracking-normal">
            REPLO
          </h1>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-6 items-center">
            <p className="text-[var(--accent-primary)] space-mono">TRAIN</p>
            <p className="text-[var(--accent-primary)]">•</p>
            <p className="text-[var(--accent-primary)] space-mono">TRACK</p>
            <p className="text-[var(--accent-primary)]">•</p>
            <p className="text-[var(--accent-primary)] space-mono">REPEAT</p>
          </div>
          <h1 className="heading-one">
            EVERY REP,
            <br /> ON THE RECORD
          </h1>
          <p className="max-w-md body-text">
            Log sessions, chase PRs, and build routines that actually stick.
            Your training history, all in one place.
          </p>
        </div>

        <p className="text-sm text-[var(--contrast-three)]">
          © {new Date().getFullYear()} REPLO. All rights reserved.
        </p>
      </section>

      {/* Right: fixed-width, route-specific */}
      <section className="flex w-full shrink-0 flex-col justify-center border-l border-[var(--contrast-one)] bg-[var(--dark-two)] p-10 lg:w-[440px]">
        <Outlet />
      </section>
    </div>
  );
};

export default AuthLayout;
