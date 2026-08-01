import { createContext } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastOptions {
  /** Short headline, e.g. "Routine duplicated". */
  title: string;
  /** Optional supporting detail, e.g. an API error message. */
  description?: string;
  variant?: ToastVariant;
  /** Milliseconds before auto-dismiss. Pass 0 to require manual dismissal. */
  duration?: number;
}

export interface Toast extends ToastOptions {
  id: string;
}

export interface ToastContextValue {
  /** Show a toast; returns its id so it can be dismissed programmatically. */
  toast: (options: ToastOptions) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
