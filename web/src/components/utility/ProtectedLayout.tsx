import { Outlet } from 'react-router-dom';
import ViewHeader from '../ui/ViewHeader';
import ErrorBoundaryModal from './ErrorBoundaryModal';
import RestTimerProvider from '../ui/RestTimerProvider';

/**
 * Layout route for all authenticated pages. The auth guard lives on the route
 * loader (see router.tsx); this component only renders the shared chrome and
 * an <Outlet /> for the matched child view.
 *
 * RestTimerProvider wraps the header + content so both the ViewHeader (mobile)
 * and WorkoutSummary (desktop) triggers share one modal and one running timer.
 */
const ProtectedLayout = () => {
  return (
    <RestTimerProvider>
      <div className="app-bg w-screen h-dvh flex flex-col">
        <ViewHeader />
        <main className="container grow min-w-screen flex flex-1 overflow-hidden overflow-y-auto">
          <ErrorBoundaryModal pageType="Page">
            <Outlet />
          </ErrorBoundaryModal>
        </main>
      </div>
    </RestTimerProvider>
  );
};

export default ProtectedLayout;
