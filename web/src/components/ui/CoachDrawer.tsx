import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiArrowUp, FiMaximize2, FiMinimize2, FiX } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { useCoachStore } from '../../stores/coach-store';
import { useToast } from '../../context/toast';
import CoachMarkdown from './CoachMarkdown';
import RoutineProposalCard from './RoutineProposalCard';
import ReploLoader from './loaders/ReploLoader';

/** Starter prompts */
// const SUGGESTIONS = [
//   'Why has my bench stalled?',
//   'What should I train next?',
//   'How should I warm up?',
// ];

/**
 * Global coach chat drawer ("REPLO AI"). Slides in from the right on any page,
 * Conversation state lives in the coach store so it survives
 * navigation.
 */
export default function CoachDrawer() {
  const isOpen = useCoachStore((s) => s.isOpen);
  const messages = useCoachStore((s) => s.messages);
  const isStreaming = useCoachStore((s) => s.isStreaming);
  const isLoadingHistory = useCoachStore((s) => s.isLoadingHistory);
  const hasMore = useCoachStore((s) => s.hasMore);
  const close = useCoachStore((s) => s.close);
  const sendMessage = useCoachStore((s) => s.sendMessage);
  const hydrate = useCoachStore((s) => s.hydrate);
  const loadMore = useCoachStore((s) => s.loadMore);

  const { error } = useToast();
  const [draft, setDraft] = useState('');
  // Desktop only: expand the side panel to fill the screen width.
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  // When prepending older history, anchor the viewport instead of jumping to
  // the bottom. Holds the scrollHeight captured just before the prepend.
  const prependAnchorRef = useRef<number | null>(null);

  // Load the most recent history the first time the drawer opens.
  useEffect(() => {
    if (isOpen) {
      void hydrate();
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }
  }, [isOpen, hydrate]);

  // Keep the latest message in view as tokens stream in — but when an older
  // page was just prepended, restore the prior scroll position so the view
  // stays anchored on the same message.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prependAnchorRef.current !== null) {
      el.scrollTop = el.scrollHeight - prependAnchorRef.current;
      prependAnchorRef.current = null;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Fetch the next older page when the user scrolls to the top.
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !hasMore || isLoadingHistory) return;
    if (el.scrollTop < 80) {
      prependAnchorRef.current = el.scrollHeight;
      void loadMore();
    }
  };

  // Lock body scroll and close on Escape while mounted.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    setDraft('');
    void sendMessage(trimmed, (message) => error("Coach couldn't respond", message));
  };

  return createPortal(
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 bg-black/60"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="REPLO AI"
        onClick={(e) => e.stopPropagation()}
        className={`animate-sheet-panel app-bg absolute inset-y-0 right-0 flex h-full w-full flex-col border-l border-[var(--contrast-one)] transition-[max-width] duration-300 ease-in-out ${
          expanded ? 'max-w-[100vw]' : 'max-w-md'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[var(--contrast-one)] px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--dark-one)]">
            <HiSparkles className="text-2xl" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-extrabold tracking-tight text-[var(--text-strong)]">
              REPLO AI
            </p>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-[var(--contrast-three)] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
              {isStreaming ? 'Thinking…' : 'Online'}
            </p>
          </div>
          <button
            type="button"
            aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
            onClick={() => setExpanded((v) => !v)}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--text-strong)] md:flex"
          >
            {expanded ? (
              <FiMinimize2 className="text-lg" />
            ) : (
              <FiMaximize2 className="text-lg" />
            )}
          </button>
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--text-strong)]"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={`flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 ${
            expanded ? 'mx-auto w-full max-w-3xl' : ''
          }`}
        >
          {isLoadingHistory && (
            <div className="flex justify-center py-1">
              <ReploLoader size={18} />
            </div>
          )}
          {/* Persistent intro — not part of the conversation sent to the API. */}
          <div className="max-w-[85%] self-start rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-3 text-sm text-[var(--text-strong)]">
            Hey! I'm your REPLO coach. Ask me anything about training, technique,
            or how to structure your workouts.
          </div>

          {messages.map((message, index) => {
            const isUser = message.role === 'user';
            const isLast = index === messages.length - 1;

            // Proposal messages render as a card, not a text bubble.
            if (message.proposal) {
              return (
                <RoutineProposalCard
                  key={index}
                  proposal={message.proposal}
                  proposalId={message.proposalId}
                  status={message.status}
                />
              );
            }

            // Skip empty assistant messages that aren't the active loader.
            if (!isUser && !message.content && !(isStreaming && isLast)) {
              return null;
            }

            return (
              <div
                key={index}
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  isUser
                    ? 'self-end bg-[var(--accent-primary)] whitespace-pre-wrap text-[var(--text-contrast)]'
                    : 'self-start border border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--text-strong)]'
                }`}
              >
                {isUser ? (
                  message.content
                ) : message.content ? (
                  <CoachMarkdown content={message.content} />
                ) : isStreaming && isLast ? (
                  <ReploLoader size={20} />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Suggestions + composer */}
        <div
          className={`w-full space-y-3 border-t border-[var(--contrast-one)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${
            expanded ? 'mx-auto max-w-3xl' : ''
          }`}
        >
          {/* {messages.length === 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submit(suggestion)}
                  className="shrink-0 rounded-full border border-[var(--contrast-one)] px-4 py-2 text-xs whitespace-nowrap text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-[var(--text-strong)]"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )} */}

          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit(draft);
                }
              }}
              rows={1}
              placeholder="Ask about your training…"
              className="max-h-32 flex-1 resize-none rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-4 py-3 text-sm text-[var(--text-strong)] outline-none focus:border-[var(--accent-primary)]"
            />
            <button
              type="button"
              aria-label="Send"
              onClick={() => submit(draft)}
              disabled={isStreaming || !draft.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-primary)] text-[var(--text-contrast)] transition-opacity disabled:opacity-40"
            >
              <FiArrowUp className="text-lg" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
