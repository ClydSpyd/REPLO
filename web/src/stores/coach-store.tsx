import { create } from 'zustand';
import { streamChat, type CoachMessage } from '../api/assistant';

interface CoachStore {
  /** Whether the drawer is showing. Global so it survives navigation. */
  isOpen: boolean;
  /** The full conversation, oldest first. */
  messages: CoachMessage[];
  /** True while a reply is streaming in. */
  isStreaming: boolean;

  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;

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

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  reset: () => set({ messages: [], isStreaming: false }),

  sendMessage: async (text, onError) => {
    const trimmed = text.trim();
    if (!trimmed || get().isStreaming) return;

    const userMessage: CoachMessage = { role: 'user', content: trimmed };

    // The payload is the history plus this turn — but NOT the empty assistant
    // placeholder we add to the UI below.
    const history = [...get().messages, userMessage];

    set((state) => ({
      messages: [...state.messages, userMessage, { role: 'assistant', content: '' }],
      isStreaming: true,
    }));

    // Append each delta to the last (assistant) message.
    const appendToLast = (delta: string) =>
      set((state) => {
        const messages = state.messages.slice();
        const last = messages[messages.length - 1];
        messages[messages.length - 1] = { ...last, content: last.content + delta };
        return { messages };
      });

    await streamChat(history, {
      onToken: appendToLast,
      onDone: () => set({ isStreaming: false }),
      onError: (message) => {
        set((state) => {
          // Drop the placeholder if nothing streamed before the failure.
          const messages = state.messages.slice();
          const last = messages[messages.length - 1];
          if (last?.role === 'assistant' && last.content === '') messages.pop();
          return { messages, isStreaming: false };
        });
        onError(message);
      },
    });
  },
}));
