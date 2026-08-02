import { Outlet } from 'react-router-dom';
import ViewHeader from '../ui/ViewHeader';
import ErrorBoundaryModal from './ErrorBoundaryModal';

/**
 * Layout route for all authenticated pages. The auth guard lives on the route
 * loader (see router.tsx); this component only renders the shared chrome and
 * an <Outlet /> for the matched child view.
 */
const ProtectedLayout = () => {
  return (
    <div className="app-bg w-screen h-dvh flex flex-col">
      <ViewHeader />
      <main className="container grow min-w-screen flex flex-1 overflow-hidden">
        <ErrorBoundaryModal pageType="Page">
          <Outlet />
        </ErrorBoundaryModal>
      </main>
    </div>
  );
};

export default ProtectedLayout;
