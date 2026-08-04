import { useEffect, useState } from 'react';

/**
 * Subscribe to a CSS media query. Reads synchronously on first render so there's
 * no wrong-breakpoint flash, then tracks changes (resize, orientation).
 *
 * Prefer Tailwind's responsive prefixes for pure styling; reach for this only
 * when a breakpoint must change behavior/structure — e.g. rendering a modal on
 * mobile vs. inline content on desktop, where CSS alone can't gate a portal or
 * body-scroll lock.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
