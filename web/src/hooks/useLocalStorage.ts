/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useRef, useState } from 'react';

type UseLocalStorageOptions = {
  enabled?: boolean;
};

function readStoredValue<T>(key: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue === null ? initialValue : (JSON.parse(storedValue) as T);
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions = {},
) {
  const { enabled = true } = options;
  const [storedValue, setStoredValue] = useState<T>(() =>
    enabled ? readStoredValue(key, initialValue) : initialValue,
  );
  const skipNextWriteRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      setStoredValue(initialValue);
      return;
    }

    setStoredValue(readStoredValue(key, initialValue));
  }, [enabled, key, initialValue]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(storedValue));
  }, [enabled, key, storedValue]);

  const clearStoredValue = useCallback(() => {
    if (enabled && typeof window !== 'undefined') {
      skipNextWriteRef.current = true;
      window.localStorage.removeItem(key);
    }

    setStoredValue(initialValue);
  }, [enabled, key, initialValue]);

  return [storedValue, setStoredValue, clearStoredValue] as const;
}