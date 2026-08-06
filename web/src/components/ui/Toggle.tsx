/**
 * Accessible on/off switch. Accent-filled when on; the knob slides across. The
 * caller owns the boolean, so this stays a controlled, presentational control.
 */
export default function Toggle({
  checked,
  onChange,
  id,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  id?: string;
  /** Accessible name when the switch has no visible <label>. */
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors ${
        checked
          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
          : 'border-[var(--contrast-one)] bg-[var(--dark-one)]'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full transition-transform ${
          checked
            ? 'translate-x-[22px] bg-[var(--text-contrast)]'
            : 'translate-x-[3px] bg-[var(--contrast-two)]'
        }`}
      />
    </button>
  );
}
