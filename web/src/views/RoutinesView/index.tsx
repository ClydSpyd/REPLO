import { useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { useMutationState } from '@tanstack/react-query';
import { useMyRoutines } from '../../queries/routines';
import { CREATE_ROUTINE_KEY } from '../../mutations/routines';
import ErrorBoundaryModal from '../../components/utility/ErrorBoundaryModal';
import RoutineCard from './components/RoutineCard';
import RoutineGhostCard from './components/RoutineGhostCard';
import RoutineBuilderModal from './components/RoutineBuilderModal';

/** A grid slot: either a saved routine, or a placeholder for one being created. */
type GridEntry =
  | {
      kind: 'routine';
      key: string;
      name: string;
      createdAt: string;
      routine: Routine;
    }
  | { kind: 'ghost'; key: string; name: string };

/**
 * The user's saved routine library. Read-only for now — the create/start/view
 * actions are wired up separately.
 */
export default function RoutinesView() {
  const [builderOpen, setBuilderOpen] = useState(false);
  const { data: routines, isLoading, error } = useMyRoutines();

  // Any create-routine mutation currently in flight, wherever it was fired
  // from. Each gets a ghost card until the list refetches.
  const pendingNames = useMutationState({
    filters: { mutationKey: CREATE_ROUTINE_KEY, status: 'pending' },
    select: (mutation) =>
      (mutation.state.variables as RoutineInput | undefined)?.name,
  });

  // Keep saved routines ordered by creation time (newest first). Ghost cards
  // represent in-flight creations, so place them first in submit order.
  const entries = useMemo<GridEntry[]>(() => {
    const saved: GridEntry[] = (routines ?? [])
      .map((routine) => ({
        kind: 'routine' as const,
        key: routine._id,
        name: routine.name,
        createdAt: routine.createdAt,
        routine,
      }))
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

    const ghosts: GridEntry[] = pendingNames
      .filter((name): name is string => Boolean(name))
      .map((name, index) => ({
        kind: 'ghost',
        key: `ghost-${index}-${name}`,
        name,
      }));

    if (ghosts.length === 0) return saved;

    return [...saved, ...ghosts];
  }, [routines, pendingNames]);

  return (
    <ErrorBoundaryModal pageType="RoutinesView">
      <div className="page-wrapper">
        <div className="w-full px-6 lg:px-2 py-6">
          {/* Header */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="anotation">Routine library</p>
              <h1 className="heading-one text-white">Workouts</h1>
            </div>

            <button
              type="button"
              onClick={() => setBuilderOpen(true)}
              className="anton flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95 lg:px-8"
            >
              <FiPlus className="text-xl" />
              New Routine
            </button>
          </div>

          {/* Count */}
          <p className="space-mono mt-8 text-xs uppercase tracking-wide text-[var(--contrast-three)]">
            My Routines
            <span className="pl-3 text-[var(--contrast-two)]">
              {routines?.length ?? 0}
            </span>
          </p>

          {/* Library */}
          <div className="mt-4">
            {isLoading && <Placeholder text="Loading routines..." />}

            {error && (
              <Placeholder text={`Couldn't load routines: ${error.message}`} />
            )}

            {!isLoading && !error && entries.length === 0 && (
              <Placeholder text="No routines saved yet — finish a session and tick 'save to my routines'" />
            )}

            {entries.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {entries.map((entry) =>
                  entry.kind === 'routine' ? (
                    <RoutineCard key={entry.key} routine={entry.routine} />
                  ) : (
                    <RoutineGhostCard key={entry.key} name={entry.name} />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {builderOpen && (
        <RoutineBuilderModal onClose={() => setBuilderOpen(false)} />
      )}
    </ErrorBoundaryModal>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="w-full rounded-lg border border-dashed border-[var(--contrast-one)] bg-[color-mix(in_srgb,var(--dark-one)_60%,transparent)] p-8 flex items-center justify-center">
      <p className="anotation text-[var(--contrast-two)]! text-xs! uppercase tracking-wide text-center">
        {text}
      </p>
    </div>
  );
}
