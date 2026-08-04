import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { RestTimerContext } from '../../context/rest-timer-context';
import { useRestTimerEngine } from '../../hooks/useRestTimerEngine';
import { useToast } from '../../hooks/useToast';
import RestTimerModal from './RestTimerModal';

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
