import { useEffect, useState } from 'react';

/**
 *
 * @param {number} initialTime - The starting time in seconds.
 * @param {boolean} [countdown=false] - If true, timer counts down; if false, counts up.
 * @returns {Object} An object containing:
 *   - time {number}: The current timer value in seconds.
 *   - isRunning {boolean}: Whether the timer is currently running.
 *   - startTimer {() => void}: Function to start/resume the timer.
 *   - pauseTimer {() => void}: Function to pause the timer.
 *   - resetTimer {() => void}: Function to reset the timer to the initial value and pause.
 *
 */
export const useTimer = (initialTime: number, countdown: boolean = false) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isRunning) {
      timer = setInterval(() => {
        setTime((prevTime) => (countdown ? prevTime - 1 : prevTime + 1));
      }, 1000);
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isRunning, countdown]);

  const startTimer = () => setIsRunning(true);
  const pauseTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTime(initialTime);
  };

  return { time, isRunning, startTimer, pauseTimer, resetTimer };
};
