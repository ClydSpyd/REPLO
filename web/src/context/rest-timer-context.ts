import { createContext } from 'react';

export interface RestTimerContextValue {
  /** Open the rest-timer modal. */
  open: () => void;
  /** Close the rest-timer modal (the timer keeps running in the background). */
  close: () => void;
  isOpen: boolean;
}

export const RestTimerContext = createContext<RestTimerContextValue | null>(
  null,
);
