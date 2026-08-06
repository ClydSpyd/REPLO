import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRestTimerEngine } from '../hooks/useRestTimerEngine';
import RestTimerModal from '../components/ui/RestTimerModal';
import { useToast } from './toast';

interface RestTimerContextValue {
  /** Open the rest-timer modal. */
  open: () => void;
  /** Close the rest-timer modal (the timer keeps running in the background). */
  close: () => void;
  isOpen: boolean;
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

/**
 * Hosts the single rest-timer modal and its timing engine, exposing open/close
 * to any descendant (the WorkoutSummary and ViewHeader triggers). The engine
 * lives here rather than in the modal so a running countdown keeps ticking
 * after the modal is closed, announcing completion via a toast.
 */
export default function RestTimerProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { info } = useToast();

  const engine = useRestTimerEngine({
    onComplete: () => info('Rest complete', 'Time to get back to it.'),
  });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <RestTimerContext.Provider value={value}>
      {children}
      {isOpen && <RestTimerModal engine={engine} onClose={close} />}
    </RestTimerContext.Provider>
  );
}

/** Access the rest-timer modal controls. Must be used within a RestTimerProvider. */
export function useRestTimer() {
  const context = useContext(RestTimerContext);
  if (!context) {
    throw new Error('useRestTimer must be used within a RestTimerProvider');
  }
  return context;
}
