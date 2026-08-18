import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import ToastProvider from './context/toast';
import ThemeProvider from './context/theme';
import PreferencesProvider from './context/preferences';
import { router } from './router';
import './index.css';

// gcTime must outlive the persisted cache, otherwise restored entries are
// evicted on load and offline views go blank. One week covers "offline tomorrow".
const WEEK = 1000 * 60 * 60 * 24 * 7;

const queryClient = new QueryClient({
  defaultOptions: { queries: { gcTime: WEEK } },
});

// Persist the whole query cache to localStorage. When offline, navigator.onLine
// is false so React Query pauses fetches and serves this restored cache instead.
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'replo-query-cache',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <PreferencesProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister,
            maxAge: WEEK,
            // Bump when query shapes change, to discard an incompatible cache.
            buster: 'v1',
            dehydrateOptions: {
              // Only persist successful queries — never cache an error state.
              shouldDehydrateQuery: (q) => q.state.status === 'success',
            },
          }}
        >
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </PersistQueryClientProvider>
      </PreferencesProvider>
    </ThemeProvider>
  </StrictMode>,
);
