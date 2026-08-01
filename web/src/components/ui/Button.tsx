import type { ReactNode } from 'react';

type ButtonSize = 's' | 'm' | 'lg' | 'xl';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  /** Optional leading icon, e.g. a react-icons element. */
  icon?: ReactNode;
  size?: ButtonSize;
  additionalClasses?: string;
  disabled?: boolean;
}

// Per-size padding, text and gap. Icon scales with the font via `em` sizing.
const SIZE_STYLES: Record<ButtonSize, string> = {
  s: 'gap-1.5 px-3 py-2 text-sm',
  m: 'gap-2 px-4 py-2.5 text-base',
  lg: 'gap-2.5 px-6 py-3 text-lg',
  xl: 'gap-3 px-8 py-4 text-2xl',
};

export default function Button({
  text,
  onClick,
  icon,
  size = 'm',
  additionalClasses,
  disabled = false,
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onClick}
      className={`anton inline-flex items-center justify-center rounded-lg  font-extrabold uppercase tracking-wide transition-colors whitespace-nowrap ${SIZE_STYLES[size]} ${disabled ? 'bg-[var(--contrast-one)] text-[var(--contrast-two)] cursor-not-allowed!' : 'bg-[var(--accent-primary)] text-black hover:brightness-95'} ${additionalClasses ?? ''}`}
    >
      {icon && <span className="flex items-center text-[1.1em]">{icon}</span>}
      {text}
    </button>
  );
}
