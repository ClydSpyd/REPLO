import { createBrowserRouter, redirect } from 'react-router-dom';
import ProtectedLayout from './components/utility/ProtectedLayout';
import AuthLayout from './components/utility/AuthLayout';
import Login from './views/Login';
import Signup from './views/Signup';
import WorkoutReview from './views/WorkoutReview';
import { navItems } from './config/nav';

// Derive the protected route children from the shared nav config. The '/' item
// becomes the index route; the rest use their path (minus the leading slash).
const navRoutes = navItems.map((item) =>
  item.path === '/'
    ? { index: true as const, element: item.element }
    : { path: item.path.replace(/^\//, ''), element: item.element },
);

/**
 * Route guard as a loader: runs before the protected layout renders, so an
 * unauthenticated user is redirected without ever flashing protected UI.
 */
function requireAuth() {
  const jwt = localStorage.getItem('access_token');
  if (!jwt) {
    throw redirect('/login');
  }
  return null;
}

/**
 * Inverse guard for the auth routes: a user who is already signed in has no
 * business on login/signup, so bounce them to the dashboard before the auth
 * layout renders.
 */
function redirectIfAuthenticated() {
  const jwt = localStorage.getItem('access_token');
  if (jwt) {
    throw redirect('/');
  }
  return null;
}

/**
 * Central route configuration. Protected pages are nested under a pathless
 * layout route that owns the auth guard and the shared chrome (header +
 * sidebar), so individual views no longer wrap themselves in a layout.
 */
export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    loader: redirectIfAuthenticated,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
    ],
  },
  {
    element: <ProtectedLayout />,
    loader: requireAuth,
    children: [
      ...navRoutes,
      // Reviewing a completed session — a detail route, not a nav destination,
      // so it lives here rather than in navItems.
      { path: 'workout/:workoutId', element: <WorkoutReview /> },
    ],
  },
  {
    path: '*',
    loader: () => redirect('/'),
  },
]);
