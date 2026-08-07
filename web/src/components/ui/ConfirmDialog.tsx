import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiTrash2 } from 'react-icons/fi';

/**
 * A centered, blocking confirmation dialog for destructive actions. Mount it
 * conditionally (render only when you want it shown). Mirrors the delete-confirm
 * styling used in RoutineDetailModal, but reusable and portalled to <body> so it
 * escapes any clipped/overflow parent.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  isPending = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Escape cancels (unless a request is in flight).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPending, onCancel]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cancel"
        disabled={isPending}
        onClick={onCancel}
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--dark-two)_70%,transparent)] backdrop-blur-sm"
      />

      <div className="relative flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-8 py-8 text-center shadow-xl">
        <div className="flex flex-col items-center gap-2">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-xl border border-red-400/60 bg-red-400/10">
            <FiTrash2 className="text-xl text-red-400" />
          </div>
          <h4 className="heading-four text-[var(--text-strong)]">{title}</h4>
          <p className="body-text max-w-md text-sm! text-[var(--contrast-three)]">
            {message}
          </p>
        </div>

        {error && (
          <p className="body-text text-sm! text-red-400">Couldn't delete: {error}</p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="space-mono rounded-lg border border-[var(--contrast-one)] px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-[var(--contrast-three)] transition-colors hover:border-[var(--contrast-two)] hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="anton rounded-lg bg-red-500 px-6 py-2.5 text-sm font-extrabold uppercase tracking-wide text-[var(--text-strong)] transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Deleting…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
