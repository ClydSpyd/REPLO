import { useContext } from 'react';
import { ThemeContext } from '../context/theme-context';

/** Read and change the active colour theme. Must be used within a ThemeProvider. */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
