import { useContext, useMemo } from 'react';
import { ToastContext, type ToastOptions } from '../context/toast-context';

type Shorthand = (title: string, description?: string) => string;

/**
 * Raise a toast from anywhere under <ToastProvider />.
 *
 *   const { success, error } = useToast();
 *   success('Routine duplicated');
 *   error("Couldn't duplicate", err.message);
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { toast, dismiss } = context;

  return useMemo(() => {
    const withVariant =
      (variant: ToastOptions['variant']): Shorthand =>
      (title, description) =>
        toast({ title, description, variant });

    return {
      toast,
      dismiss,
      success: withVariant('success'),
      error: withVariant('error'),
      info: withVariant('info'),
    };
  }, [toast, dismiss]);
}
