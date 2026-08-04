import { useContext } from 'react';
import { RestTimerContext } from '../context/rest-timer-context';

/** Access the rest-timer modal controls. Must be used within a RestTimerProvider. */
export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
}
