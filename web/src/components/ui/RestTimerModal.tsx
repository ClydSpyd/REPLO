import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FaPause, FaPlay, FaStopwatch } from 'react-icons/fa';
import { FiEdit2, FiMinus, FiPlus, FiX } from 'react-icons/fi';
import { LuTimer } from 'react-icons/lu';
import useOutsideClick from '../../hooks/useOutsideClick';
import type {
  RestTimerEngine,
  RestTimerMode,
} from '../../hooks/useRestTimerEngine';

/** MM:SS from ms — ceil for a countdown (shows the full second until it elapses), floor for a stopwatch. */
function formatClock(displayMs: number, mode: RestTimerMode): string {
  const totalSec =
    mode === 'stopwatch'
      ? Math.floor(displayMs / 1000)
      : Math.ceil(displayMs / 1000);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

/** Preset label: `M:SS` (e.g. 1:30) — minutes unpadded, matching the mockup. */
function formatPreset(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function RestTimerModal({
  engine,
  onClose,
}: {
  engine: RestTimerEngine;
  onClose: () => void;
}) {
  const {
    mode,
    setMode,
    isRunning,
    displayMs,
    progress,
    presets,
    selectedPresetIndex,
    selectPreset,
    adjustPreset,
    start,
    pause,
    reset,
  } = engine;

  const panelRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  useOutsideClick(panelRef, onClose);

  // Lock body scroll and close on Escape while mounted.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const canStart = mode === 'stopwatch' || displayMs > 0;

  return createPortal(
    <div
      className="animate-modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Rest timer"
    >
      <div
        ref={panelRef}
        className="animate-modal-panel relative w-full max-w-[560px] rounded-2xl border border-[var(--contrast-one)] bg-[var(--dark-two)] p-6 text-white shadow-2xl lg:p-8"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <p className="space-mono text-sm uppercase tracking-wide text-[var(--accent-primary)]">
            Rest Timer
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--contrast-one)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] p-1.5">
          <ModeTab
            icon={<LuTimer />}
            label="Timer"
            active={mode === 'timer'}
            onClick={() => setMode('timer')}
          />
          <ModeTab
            icon={<FaStopwatch />}
            label="Stopwatch"
            active={mode === 'stopwatch'}
            onClick={() => setMode('stopwatch')}
          />
        </div>

        {/* Display */}
        <div className="anotation my-8 text-center text-7xl! font-bold tracking-normal! text-white! tabular-nums lg:text-8xl!">
          {formatClock(displayMs, mode)}
        </div>

        {/* Timer-only: progress + quick presets */}
        {mode === 'timer' && (
          <>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dark-one)]">
              <div
                className="h-full rounded-full bg-[var(--accent-primary)] transition-[width] duration-200 ease-linear"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="space-mono whitespace-nowrap text-xs uppercase tracking-wide text-[var(--contrast-three)]">
                Quick Presets
              </span>
              <span className="h-px flex-1 bg-[var(--contrast-one)]" />
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className="space-mono flex items-center gap-1.5 text-xs uppercase tracking-wide text-[var(--accent-primary)] transition-opacity hover:opacity-80"
              >
                <FiEdit2 />
                {editing ? 'Done' : 'Edit'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {presets.map((seconds, index) =>
                editing ? (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-1 rounded-xl border border-[var(--accent-primary)] bg-[var(--dark-one)] p-1.5"
                  >
                    <StepButton
                      label={`Decrease preset ${index + 1}`}
                      onClick={() => adjustPreset(index, -1)}
                    >
                      <FiMinus />
                    </StepButton>
                    <span className="space-mono text-sm text-[var(--accent-primary)] tabular-nums">
                      {formatPreset(seconds)}
                    </span>
                    <StepButton
                      label={`Increase preset ${index + 1}`}
                      onClick={() => adjustPreset(index, 1)}
                    >
                      <FiPlus />
                    </StepButton>
                  </div>
                ) : (
                  <button
                    key={index}
                    type="button"
                    onClick={() => selectPreset(seconds)}
                    aria-pressed={selectedPresetIndex === index}
                    className={`space-mono rounded-xl border px-2 py-4 text-sm tabular-nums transition-colors ${
                      selectedPresetIndex === index
                        ? 'border-[var(--accent-primary)] bg-[var(--hint-primary-dark)] text-[var(--accent-primary)]'
                        : 'border-[var(--contrast-one)] bg-[var(--dark-one)] text-[var(--contrast-three)] hover:border-[var(--accent-primary)]'
                    }`}
                  >
                    {formatPreset(seconds)}
                  </button>
                ),
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={isRunning ? pause : start}
            disabled={!isRunning && !canStart}
            className="anton flex items-center justify-center gap-2 rounded-xl bg-[var(--accent-primary)] px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-black transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <FaPause className="text-sm" />
                Pause
              </>
            ) : (
              <>
                <FaPlay className="text-sm" />
                Start
              </>
            )}
          </button>
          <button
            type="button"
            onClick={reset}
            className="anton rounded-xl border border-[var(--contrast-one)] bg-[var(--dark-one)] px-6 py-4 text-lg font-extrabold uppercase tracking-wide text-white transition-colors hover:border-[var(--accent-primary)]"
          >
            Reset
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ModeTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`anton flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-extrabold uppercase tracking-wide transition-colors ${
        active
          ? 'bg-[var(--accent-primary)] text-black'
          : 'text-[var(--contrast-three)] hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function StepButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--contrast-one)] bg-[var(--dark-two)] text-[var(--contrast-three)] transition-colors hover:border-[var(--accent-primary)] hover:text-white"
    >
      {children}
    </button>
  );
}
