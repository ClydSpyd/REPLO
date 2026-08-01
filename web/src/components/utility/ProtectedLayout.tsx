import { Outlet } from 'react-router-dom';
import ViewHeader from '../ui/ViewHeader';

/**
 * Layout route for all authenticated pages. The auth guard lives on the route
 * loader (see router.tsx); this component only renders the shared chrome and
 * an <Outlet /> for the matched child view.
 */
const ProtectedLayout = () => {
  return (
    <div className="app-bg w-screen min-h-screen flex flex-col">
      <ViewHeader />
      <main className="container grow min-w-screen flex flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default ProtectedLayout;
