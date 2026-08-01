import { useEffect, useRef } from 'react';

interface WorkoutNotesProps {
  /** Initial notes text. The field is uncontrolled, so typing is never fought. */
  notes?: string;
  /** Called with the latest text once the user pauses typing. */
  onSave?: (notes: string) => void;
  /** Render as read-only (no editing). */
  readOnly?: boolean;
  debounceMs?: number;
}

export default function WorkoutNotes({
  notes,
  onSave,
  readOnly = false,
  debounceMs = 600,
}: WorkoutNotesProps) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Don't leave a pending save timer running after unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const handleChange = (value: string) => {
    if (!onSave) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onSave(value), debounceMs);
  };

  return (
    <div className="w-full h-fit module-wrapper">
      <p className="text-white/80 font-bold text-xs mb-2">NOTES</p>
      <textarea
        defaultValue={notes ?? ''}
        readOnly={readOnly}
        placeholder={
          readOnly
            ? 'No notes for this session'
            : 'Add notes about this workout...'
        }
        onChange={(e) => handleChange(e.target.value)}
        className="w-full h-[100px] bg-[var(--dark-two)] border-2 border-[var(--contrast-one)] rounded-md text-white resize-none p-2! read-only:opacity-70"
      />
    </div>
  );
}
