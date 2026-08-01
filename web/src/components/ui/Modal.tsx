import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';
import useOutsideClick from '../../hooks/useOutsideClick';

interface ModalProps {
  /** Large title, e.g. "BUILD YOUR SESSION". */
  mainHeading: string;
  /** Small eyebrow above the title — a string, or richer markup (tags, etc.). */
  subHeading: ReactNode;
  /** Optional supporting line under the title. */
  description?: ReactNode;
  /** Optional actions pinned below the scrolling content. */
  footer?: ReactNode;
  /** `wide` suits two-column content such as the routine builder. */
  size?: 'default' | 'wide';
  /**
   * Optional layer covering the whole panel (confirmation steps, etc.).
   * Lives inside the panel so it doesn't trip the outside-click dismissal a
   * separately-portaled modal would.
   */
  overlay?: ReactNode;
  /** Called once when the modal mounts. */
  onOpen?: () => void;
  /** Called when the user dismisses the modal (backdrop, Escape, or close button). */
  onClose?: () => void;
  children?: ReactNode;
}

/**
 * Reusable modal: renders a centered, slide-up panel over a dimmed backdrop.
 * Visibility is controlled by the parent mounting/unmounting this component;
 * `onClose` fires when the user requests dismissal so the parent can unmount it.
 */
export default function Modal({
  mainHeading,
  subHeading,
  description,
  footer,
  overlay,
  size = 'default',
  onOpen,
  onClose,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleClose = () => onClose?.();
  useOutsideClick(panelRef, handleClose);

  // Fire onOpen once, lock body scroll, and close on Escape while mounted.
  useEffect(() => {
    onOpen?.();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mainHeading}
    >
      <div
        ref={panelRef}
        className={`animate-modal-panel relative flex max-h-[90vh] w-full flex-col ${size === 'wide' ? 'max-w-6xl' : 'max-w-3xl'} overflow-hidden rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-two)] text-white shadow-2xl`}
      >
        {overlay}

        {/* Header */}
        <div className="relative border-b border-[var(--contrast-one)] px-8 py-6 min-h-25">
          <button
            type="button"
            aria-label="Close"
            onClick={handleClose}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
          >
            <FiX className="text-xl" />
          </button>

          {/* A div, not a p — subHeading may carry markup (tags, chips). */}
          <div className="space-mono pr-12 text-xs uppercase tracking-wide text-[var(--accent-primary)]">
            {subHeading}
          </div>
          <h2 className="mt-1 heading-three pr-12">{mainHeading}</h2>
          {description && (
            <p className="mt-2 body-text text-sm! text-[var(--contrast-three)]">
              {description}
            </p>
          )}
        </div>

        {/* Case-by-case content */}
        <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
          {children}
        </div>

        {/* Optional pinned actions */}
        {footer && (
          <div className="border-t border-[var(--contrast-one)] px-4 py-4 lg:px-8 lg:py-5">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
