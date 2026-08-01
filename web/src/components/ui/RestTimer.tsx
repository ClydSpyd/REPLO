import { FaPause, FaPlay } from 'react-icons/fa';
import { RiResetRightLine } from 'react-icons/ri';
import { useTimer } from '../../hooks/useTimer';
import { forwardRef, useImperativeHandle } from 'react';

export interface RestTimerHandle {
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

const RestTimer = forwardRef<RestTimerHandle, { display?: boolean }>(
  ({ display }, ref) => {
    const { time, isRunning, startTimer, pauseTimer, resetTimer } = useTimer(0);

    useImperativeHandle(
      ref,
      () => ({
        startTimer,
        pauseTimer,
        resetTimer,
      }),
      [startTimer, pauseTimer, resetTimer],
    );

    if (!display) {
      return null;
    }

    return (
      <div className="mt-3 w-full h-fit module-wrapper transition-all duration-200">
        <p className="text-white/80 font-bold text-sm">REST TIMER</p>
        <div className="w-full flex justify-center text-[45px] font-bold font-mono text-[var(--accent-primary)] mb-2">
          {time === 0 && !isRunning
            ? '--:--'
            : new Date(time * 1000).toISOString().substr(14, 5)}
        </div>
        <div className="grid grid-cols-2 w-full h-[45px] gap-2">
          {!isRunning ? (
            <div
              onClick={startTimer}
              className="w-full h-full flex items-center justify-center gap-2 text-white rounded-md bg-[var(--accent-primary)]"
            >
              <FaPlay className="text-sm text-white" />
              Start
            </div>
          ) : (
            <div
              onClick={pauseTimer}
              className="w-full h-full flex items-center justify-center gap-2 text-white rounded-md bg-[var(--dark-two)] border-2 border-[var(--contrast-one)]"
            >
              <FaPause className="text-sm text-white" />
              Pause
            </div>
          )}
          <div
            onClick={resetTimer}
            className="w-full h-full flex items-center justify-center gap-2 text-white rounded-md bg-[var(--dark-two)] border-2 border-[var(--contrast-one)]"
          >
            <RiResetRightLine className="text-sm text-white" />
            Reset
          </div>
        </div>
      </div>
    );
  },
);

RestTimer.displayName = 'RestTimer';

export default RestTimer;
