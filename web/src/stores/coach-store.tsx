import { create } from 'zustand';
import {
  streamChat,
  type CoachMessage,
  type ProposalEvent,
  type ProposalStatus,
} from '../api/assistant';
import { conversationMethods } from '../api/conversation';

/**
 * Flatten the conversation into plain text turns for the LLM. Proposal turns
 * carry no text (`content: ''`), so replace them with a short synthetic line —
 * this keeps the model aware of what it proposed AND avoids sending
 * empty-content messages, which the API rejects.
 */
function toHistory(messages: CoachMessage[]): CoachMessage[] {
  return messages
    .map((m) => {
      if (m.proposal) {
        const note =
          m.status === 'accepted'
            ? 'accepted'
            : m.status === 'dismissed'
              ? 'dismissed'
              : 'awaiting the user';
        return {
          role: 'assistant' as const,
          content: `(proposed routine "${m.proposal.name}" — ${note})`,
        };
      }
      return { role: m.role, content: m.content };
    })
    .filter((m) => m.content.trim() !== '');
}

interface CoachStore {
  /** Whether the drawer is showing. Global so it survives navigation. */
  isOpen: boolean;
  /** The loaded conversation window, oldest first (always a tail slice of history). */
  messages: CoachMessage[];
  /** True while a reply is streaming in. */
  isStreaming: boolean;
  /** True once the initial history page has been fetched. */
  hydrated: boolean;
  /** True while an older page is being fetched. */
  isLoadingHistory: boolean;
  /** Whether older messages remain in the DB beyond what's loaded. */
  hasMore: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;

  /** Load the most recent page of history (once). */
  hydrate: () => Promise<void>;
  /** Prepend the next older page of history. */
  loadMore: () => Promise<void>;
  /** Update a proposal message's status in place (after accept/dismiss). */
  setProposalStatus: (
    proposalId: string,
    status: ProposalStatus,
    routineId?: string,
  ) => void;

  /**
   * Send a user message and stream the reply.
   * `onError` lets the calling component surface failures (e.g. a toast)
   * without the store depending on React context.
   */
  sendMessage: (text: string, onError: (message: string) => void) => Promise<void>;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  isOpen: false,
  messages: [],
  isStreaming: false,
  hydrated: false,
  isLoadingHistory: false,
  hasMore: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  reset: () =>
    set({ messages: [], isStreaming: false, hydrated: false, hasMore: false }),

  hydrate: async () => {
    if (get().hydrated) return;
    const page = await conversationMethods.getActive(0, 10);
    set({ messages: page.messages, hasMore: page.hasMore, hydrated: true });
  },

  loadMore: async () => {
    const { hasMore, isLoadingHistory, isStreaming, messages } = get();
    if (!hasMore || isLoadingHistory || isStreaming) return;
    set({ isLoadingHistory: true });
    try {
      // Offset is the current window size — loaded messages are always a
      // contiguous tail slice, so this fetches the next older page.
      const page = await conversationMethods.getActive(messages.length, 5);
      set((state) => ({
        messages: [...page.messages, ...state.messages],
        hasMore: page.hasMore,
        isLoadingHistory: false,
      }));
    } catch {
      set({ isLoadingHistory: false });
    }
  },

  setProposalStatus: (proposalId, status, routineId) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.proposalId === proposalId ? { ...m, status, routineId } : m,
      ),
    })),

  sendMessage: async (text, onError) => {
    const trimmed = text.trim();
    if (!trimmed || get().isStreaming) return;

    const userMessage: CoachMessage = { role: 'user', content: trimmed };

    // The payload is the history plus this turn (flattened to text turns), but
    // NOT the empty assistant placeholder we add to the UI below.
    const history = toHistory([...get().messages, userMessage]);

    set((state) => ({
      messages: [...state.messages, userMessage, { role: 'assistant', content: '' }],
      isStreaming: true,
    }));

    // Append each delta to the trailing assistant text bubble. If the last
    // message is a proposal card, start a fresh text bubble after it.
    const appendToLast = (delta: string) =>
      set((state) => {
        const messages = state.messages.slice();
        const last = messages[messages.length - 1];
        if (!last || last.role !== 'assistant' || last.proposal) {
          messages.push({ role: 'assistant', content: delta });
        } else {
          messages[messages.length - 1] = { ...last, content: last.content + delta };
        }
        return { messages };
      });

    // Render a proposal as a card. Reuse the empty streaming placeholder when
    // no text preceded it; otherwise append the card as its own message.
    const addProposal = ({ proposalId, ...proposal }: ProposalEvent) =>
      set((state) => {
        const messages = state.messages.slice();
        const card: CoachMessage = {
          role: 'assistant',
          content: '',
          proposal,
          proposalId,
          status: 'pending',
        };
        const last = messages[messages.length - 1];
        if (last?.role === 'assistant' && last.content === '' && !last.proposal) {
          messages[messages.length - 1] = card;
        } else {
          messages.push(card);
        }
        return { messages };
      });

    await streamChat(history, {
      onToken: appendToLast,
      onProposal: addProposal,
      onDone: () => set({ isStreaming: false }),
      onError: (message) => {
        console.error('Coach stream failed', message);
        set((state) => {
          // Drop the placeholder if nothing (text or card) streamed before the failure.
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          if (last?.role === 'assistant' && last.content === '' && !last.proposal) {
            messages.pop();
          }
          return { messages, isStreaming: false };
        });
        onError(message);
      },
    });
  },
}));
