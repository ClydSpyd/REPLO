import { FiCheck, FiPlus, FiX } from 'react-icons/fi';
import type { RoutineProposal, ProposalStatus } from '../../api/assistant';
import { conversationMethods } from '../../api/conversation';
import { useCreateRoutine } from '../../mutations/routines';
import { useCoachStore } from '../../stores/coach-store';
import { useToast } from '../../context/toast';

/**
 * Renders a coach-proposed routine as a confirm card. "Add routine" writes
 * through the existing routine create mutation — the LLM never writes. The
 * accepted/dismissed outcome is persisted so the card survives a reload.
 */
export default function RoutineProposalCard({
  proposal,
  proposalId,
  status = 'pending',
}: {
  proposal: RoutineProposal;
  proposalId?: string;
  status?: ProposalStatus;
}) {
  const { success, error } = useToast();
  const createRoutine = useCreateRoutine();
  const setProposalStatus = useCoachStore((s) => s.setProposalStatus);

  // Record the outcome locally (store) + server, best-effort on the server.
  const persist = (next: 'accepted' | 'dismissed', routineId?: string) => {
    if (proposalId) {
      setProposalStatus(proposalId, next, routineId);
      void conversationMethods
        .updateProposalStatus(proposalId, next, routineId)
        .catch(() => {
          /* non-fatal: the drawer already reflects the change */
        });
    }
  };

  const add = () => {
    createRoutine.mutate(
      {
        name: proposal.name,
        tags: proposal.tags,
        description: proposal.description,
        exercises: proposal.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
        })) as RoutineInput['exercises'],
      },
      {
        onSuccess: (routine) => {
          persist('accepted', routine._id);
          success('Routine added', proposal.name);
        },
        onError: (err) =>
          error(
            "Couldn't add routine",
            err instanceof Error ? err.message : 'Please try again',
          ),
      },
    );
  };

  // Dismissed proposals collapse to a muted stub so the transcript stays coherent.
  if (status === 'dismissed') {
    return (
      <div className="self-start max-w-[92%] rounded-xl border border-dashed border-[var(--contrast-one)] px-4 py-2 text-xs text-[var(--contrast-three)]">
        Dismissed suggestion · {proposal.name}
      </div>
    );
  }

  const accepted = status === 'accepted';

  return (
    <div className="self-start w-full max-w-[92%] h-fit rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)]">
      {/* Header */}
      <div className="border-b border-[var(--contrast-one)] px-4 py-3">
        <p className="text-sm font-extrabold tracking-tight text-[var(--text-strong)]">
          {proposal.name}
        </p>
        {proposal.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {proposal.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--contrast-one)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--contrast-three)] uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Exercises */}
      <ul className="divide-y divide-[var(--contrast-one)]">
        {proposal.exercises.map((ex, i) => (
          <li key={i} className="flex items-baseline justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm text-[var(--text-strong)]">
                {ex.name || ex.exerciseId}
              </p>
              {ex.primaryMuscleGroups.length > 0 && (
                <p className="truncate text-[11px] text-[var(--contrast-three)]">
                  {ex.primaryMuscleGroups.join(' · ')}
                </p>
              )}
            </div>
            <span className="shrink-0 text-xs font-semibold text-[var(--contrast-three)]">
              {ex.sets.length} × {ex.sets[0]?.reps ?? 0}
            </span>
          </li>
        ))}
      </ul>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-[var(--contrast-one)] px-4 py-3">
        {accepted ? (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#4ade80]">
            <FiCheck /> Added
          </span>
        ) : (
          <>
            <button
              type="button"
              onClick={add}
              disabled={createRoutine.isPending}
              className="flex items-center gap-1.5 rounded-lg bg-[var(--accent-primary)] px-3 py-2 text-sm font-semibold text-[var(--text-contrast)] transition-opacity disabled:opacity-40"
            >
              <FiPlus /> {createRoutine.isPending ? 'Adding…' : 'Add routine'}
            </button>
            <button
              type="button"
              onClick={() => persist('dismissed')}
              disabled={createRoutine.isPending}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--contrast-one)] px-3 py-2 text-sm text-[var(--contrast-three)] transition-colors hover:text-[var(--text-strong)] disabled:opacity-40"
            >
              <FiX /> Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}
