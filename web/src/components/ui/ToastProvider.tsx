import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiAlertCircle, FiCheckCircle, FiInfo, FiX } from 'react-icons/fi';
import {
  ToastContext,
  type Toast,
  type ToastOptions,
  type ToastVariant,
} from '../../context/toast-context';

const DEFAULT_DURATION = 5000;
/** Failures get longer on screen — they usually carry something to read. */
const ERROR_DURATION = 8000;

let nextId = 0;

const VARIANT_STYLES: Record<
  ToastVariant,
  { border: string; icon: string; Icon: typeof FiInfo }
> = {
  success: {
    border: 'border-l-[var(--accent-primary)]',
    icon: 'text-[var(--accent-primary)]',
    Icon: FiCheckCircle,
  },
  error: {
    border: 'border-l-red-400',
    icon: 'text-red-400',
    Icon: FiAlertCircle,
  },
  info: {
    border: 'border-l-[var(--contrast-two)]',
    icon: 'text-[var(--contrast-three)]',
    Icon: FiInfo,
  },
};

/**
 * App-wide toast host. Renders a fixed, portaled stack above every other layer
 * (modals included) so notifications survive the component that raised them
 * unmounting — e.g. a card disappearing after a successful delete.
 */
export default function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((entry) => entry.id !== id));
  }, []);

  const toast = useCallback(
    ({ variant = 'info', duration, ...rest }: ToastOptions) => {
      const id = `toast-${nextId++}`;
      setToasts((current) => [...current, { id, variant, ...rest }]);

      const ttl =
        duration ??
        (variant === 'error' ? ERROR_DURATION : DEFAULT_DURATION);
      if (ttl > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), ttl),
        );
      }

      return id;
    },
    [dismiss],
  );

  // Don't leave timers running after unmount.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[380px]"
        >
          {toasts.map((entry) => {
            const styles = VARIANT_STYLES[entry.variant ?? 'info'];
            const { Icon } = styles;

            return (
              <div
                key={entry.id}
                role={entry.variant === 'error' ? 'alert' : 'status'}
                className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-l-4 border-[var(--contrast-one)] bg-[var(--dark-one)] p-4 shadow-2xl ${styles.border}`}
              >
                <Icon className={`mt-0.5 shrink-0 text-lg ${styles.icon}`} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{entry.title}</p>
                  {entry.description && (
                    <p className="body-text mt-0.5 text-xs! break-words">
                      {entry.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(entry.id)}
                  className="shrink-0 text-[var(--contrast-three)] transition-colors hover:text-white"
                >
                  <FiX />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}
