import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiEdit2, FiLayers, FiPlus } from 'react-icons/fi';
import BarsLogo from '../../../components/ui/BarsLogo';

/**
 * Landing state for the workout view when the user has no session in progress.
 * Offers the ways into a workout; only "start on the fly" is wired up so far.
 */
export default function NoActiveSession() {
  const navigate = useNavigate();

  return (
    <div className="w-full flex flex-col items-center justify-center px-6 py-12 lg:py-20">
      {/* Mark */}
      <div className="flex h-[104px] w-[104px] items-center justify-center rounded-3xl border border-[var(--accent-primary)] bg-[var(--hint-primary-dark)]">
        <BarsLogo
          size={52}
          barColors={['#E8A33D', '#E8821E', '#D2570D']}
          cornerRadius={5}
        />
      </div>

      <p className="anotation mt-5 text-[var(--accent-primary)]!">
        No active session
      </p>

      <h1 className="anton mt-2 text-center text-6xl lg:text-8xl uppercase text-white">
        Nothing on the bar
      </h1>

      <p className="body-text mt-4 max-w-[640px] text-center text-[var(--contrast-three)]">
        The rack's empty right now. Pick how you want to train today — jump
        straight in, load a saved routine, or build a new one before you start.
      </p>

      {/* Entry points */}
      <div className="mt-12 grid w-full max-w-[1180px] grid-cols-1 gap-5 lg:grid-cols-3">
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
          title="From routine library"
          description="Load a saved plan and start lifting instantly."
          cta="Browse routines"
        />
        <OptionCard
          icon={<FiEdit2 />}
          title="Build a routine"
          description="Design a reusable plan, then launch it here."
          cta="Create new"
        />
      </div>
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
  /** Omit to render an inert card (not yet wired up). */
  onClick?: () => void;
}

function OptionCard({
  icon,
  title,
  description,
  cta,
  highlighted = false,
  onClick,
}: OptionCardProps) {
  const interactive = Boolean(onClick);

  const content = (
    <>
      <div
        className={`flex h-[68px] w-[68px] items-center justify-center rounded-2xl text-2xl ${
          highlighted
            ? 'bg-[var(--accent-primary)] text-black'
            : 'border border-[var(--contrast-one)] bg-[var(--dark-two)] text-white'
        }`}
      >
        {icon}
      </div>

      <h3 className="anton mt-8 text-2xl uppercase tracking-wide text-white">
        {title}
      </h3>

      <p className="body-text mt-3 text-sm! text-[var(--contrast-three)]">
        {description}
      </p>

      <span
        className={`space-mono mt-8 flex items-center gap-1.5 text-xs uppercase tracking-wide ${
          highlighted
            ? 'text-[var(--accent-primary)]'
            : 'text-[var(--contrast-three)]'
        }`}
      >
        {cta}
        <FiChevronRight />
      </span>
    </>
  );

  const className = `flex flex-col rounded-2xl border p-8 text-left transition-colors ${
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
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
