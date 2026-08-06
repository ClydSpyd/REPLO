import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/** App-wide user preferences, persisted to localStorage. */
export interface Preferences {
  /**
   * When on, adjusting a set's reps/weight in the active workout cascades the
   * new value to the following (not-yet-logged) sets of that exercise.
   */
  cascadeSetEdits: boolean;
}

const DEFAULT_PREFERENCES: Preferences = {
  cascadeSetEdits: false,
};

interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

/** localStorage key holding the JSON-serialised {@link Preferences}. */
const PREFERENCES_STORAGE_KEY = 'replo:preferences';

/**
 * Read saved preferences, merged over the defaults so a stored blob missing
 * newer keys (or malformed) still yields a complete, valid object.
 */
function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_PREFERENCES, ...(parsed as Partial<Preferences>) };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return { ...DEFAULT_PREFERENCES };
}

export default function PreferencesProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(
        PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );
    } catch {
      /* ignore write failures (private mode, quota) */
    }
  }, [preferences]);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
      setPreferences((prev) => ({ ...prev, [key]: value })),
    [],
  );

  const value = useMemo(
    () => ({ preferences, setPreference }),
    [preferences, setPreference],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

/** Read and update app-wide user preferences. Must be used within a PreferencesProvider. */
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
